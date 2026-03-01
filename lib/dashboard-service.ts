import { unstable_cache } from "next/cache";
import { formatMoney, getDeltaDirection } from "@/lib/format";
import { readHistorySnapshots } from "@/lib/google-sheets-history";
import { mockDashboardData } from "@/lib/mock-data";
import { readManualFallback } from "@/lib/manual-fallback-store";
import { formatCmcDelta, fetchCmcOrderlyTokenData } from "@/lib/providers/cmc";
import { fetchDefiLlamaPerpsData } from "@/lib/providers/defillama";
import { fetchMetabaseMarketShareData, formatMetabaseDelta } from "@/lib/providers/metabase";
import { fetchOrderlyDexBoardData } from "@/lib/providers/orderly-dex";
import { DashboardData, SeriesPoint } from "@/lib/types";

const DAY_SECONDS = 60 * 60 * 24;

function asRank(value: number): string {
  return `#${Math.round(value)}`;
}

function applyDelta(target: { value: string; direction: "up" | "down" | "flat"; label?: string }, delta: number, suffix = "%") {
  target.value = `${delta > 0 ? "+" : ""}${delta.toFixed(suffix === "%" ? 2 : 0)}${suffix}`;
  target.direction = getDeltaDirection(delta);
}

function buildTrendFromHistory(points: Array<{ date: string; value?: number }>, limit: number): SeriesPoint[] {
  const filtered = points.filter((point) => typeof point.value === "number") as Array<{ date: string; value: number }>;
  const slice = filtered.slice(-limit);
  return slice.map((point, index) => ({
    label: index === slice.length - 1 ? "Now" : `W-${slice.length - 1 - index}`,
    value: point.value
  }));
}

function applyHistoryOverlay(data: DashboardData, history: Awaited<ReturnType<typeof readHistorySnapshots>>) {
  if (history.length === 0) return;

  const latest = history[history.length - 1];
  const previous = history.length > 1 ? history[history.length - 2] : undefined;

  if (latest.total_perp_volume_7d !== undefined) {
    const kpi = data.sections.defi.kpis.find((item) => item.id === "weekly-perp-volume");
    if (kpi) {
      kpi.value = formatMoney(latest.total_perp_volume_7d, 1);
      if (previous?.total_perp_volume_7d) {
        const wow = ((latest.total_perp_volume_7d - previous.total_perp_volume_7d) / previous.total_perp_volume_7d) * 100;
        if (kpi.delta) {
          applyDelta(kpi.delta, wow, "%");
          kpi.delta.label = "WoW";
        }
      }
      kpi.source = latest.source ?? "auto";
    }

    data.sections.defi.trend6w = buildTrendFromHistory(
      history.map((item) => ({ date: item.date, value: item.total_perp_volume_7d ? item.total_perp_volume_7d / 1_000_000_000 : undefined })),
      6
    );
  }

  if (latest.orderly_rank_30d !== undefined) {
    const kpi = data.sections.defi.kpis.find((item) => item.id === "orderly-rank");
    if (kpi) {
      kpi.value = asRank(latest.orderly_rank_30d);
      if (previous?.orderly_rank_30d !== undefined && kpi.delta) {
        const deltaRank = previous.orderly_rank_30d - latest.orderly_rank_30d;
        applyDelta(kpi.delta, deltaRank, "");
        kpi.delta.label = "WoW";
      }
      kpi.source = latest.source ?? "auto";
    }

    data.sections.defi.rankTrend6w = buildTrendFromHistory(
      history.map((item) => ({ date: item.date, value: item.orderly_rank_30d })),
      6
    );
  }

  if (latest.top3_name_1 && latest.top3_vol_1 !== undefined) {
    data.sections.defi.leaderboard = [
      { name: latest.top3_name_1, volume: formatMoney(latest.top3_vol_1, 1) },
      { name: latest.top3_name_2 ?? "", volume: formatMoney(latest.top3_vol_2 ?? 0, 1) },
      { name: latest.top3_name_3 ?? "", volume: formatMoney(latest.top3_vol_3 ?? 0, 1) }
    ].filter((row) => row.name);
  }

  if (latest.total_dexs !== undefined) {
    const totalKpi = data.sections.ecosystem.kpis.find((item) => item.id === "total-dexs");
    if (totalKpi) {
      totalKpi.value = latest.total_dexs.toLocaleString();
      if (previous?.total_dexs !== undefined && totalKpi.delta) {
        applyDelta(totalKpi.delta, latest.total_dexs - previous.total_dexs, "");
        totalKpi.delta.label = "WoW";
      }
      totalKpi.source = latest.source ?? "auto";
    }
  }

  if (latest.graduated_dexs !== undefined) {
    const gradKpi = data.sections.ecosystem.kpis.find((item) => item.id === "graduated-dexs");
    if (gradKpi) {
      gradKpi.value = latest.graduated_dexs.toLocaleString();
      if (previous?.graduated_dexs !== undefined && gradKpi.delta) {
        applyDelta(gradKpi.delta, latest.graduated_dexs - previous.graduated_dexs, "");
        gradKpi.delta.label = "WoW";
      }
      gradKpi.source = latest.source ?? "auto";
    }
  }

  data.sections.ecosystem.onboardingTrend = history
    .map((item, index) => {
      const prev = index > 0 ? history[index - 1] : undefined;
      if (item.total_dexs === undefined) return null;
      const value = prev?.total_dexs !== undefined ? Math.max(item.total_dexs - prev.total_dexs, 0) : 0;
      return { label: item.date, value };
    })
    .filter((item): item is { label: string; value: number } => Boolean(item))
    .slice(-8)
    .map((item, index, arr) => ({
      label: index === arr.length - 1 ? "Now" : `W-${arr.length - 1 - index}`,
      value: item.value
    }));

  if (latest.order_cmc_rank !== undefined) {
    data.sections.token.rankTrend6w = buildTrendFromHistory(
      history.map((item) => ({ date: item.date, value: item.order_cmc_rank })),
      6
    );
  }

  data.sections.defi.lastUpdated = `${latest.date}T00:00:00.000Z`;
  data.sections.ecosystem.lastUpdated = `${latest.date}T00:00:00.000Z`;
}

async function getDashboardDataUncached(): Promise<DashboardData> {
  const data: DashboardData = JSON.parse(JSON.stringify(mockDashboardData));

  const [cmcData, metabaseMarketShare, defillamaData, orderlyDexData, history] = await Promise.all([
    fetchCmcOrderlyTokenData(),
    fetchMetabaseMarketShareData(),
    fetchDefiLlamaPerpsData(),
    fetchOrderlyDexBoardData(),
    readHistorySnapshots(12)
  ]);

  if (cmcData) {
    const priceKpi = data.sections.token.kpis.find((item) => item.id === "order-price");
    if (priceKpi) {
      priceKpi.value = `$${cmcData.price.toFixed(cmcData.price >= 1 ? 2 : 4)}`;
      priceKpi.delta = formatCmcDelta(cmcData.percentChange24h) ?? priceKpi.delta;
      priceKpi.source = "auto";
    }

    const rankKpi = data.sections.token.kpis.find((item) => item.id === "cmc-rank");
    if (rankKpi) {
      rankKpi.value = `#${cmcData.cmcRank}`;
      rankKpi.source = "auto";
    }

    data.sections.token.lastUpdated = cmcData.fetchedAt;
    data.asOf = cmcData.fetchedAt;
  }

  if (metabaseMarketShare) {
    const marketShareKpi = data.sections.business.kpis.find((item) => item.id === "market-share");
    if (marketShareKpi) {
      marketShareKpi.value = `${metabaseMarketShare.current.toFixed(2)}%`;
      marketShareKpi.delta = formatMetabaseDelta(metabaseMarketShare.delta);
      marketShareKpi.source = "auto";
    }

    data.sections.business.marketShareTrend = metabaseMarketShare.trend.map((point, index, arr) => ({
      label: index === arr.length - 1 ? "Now" : `W-${arr.length - 1 - index}`,
      value: point.value
    }));

    data.sections.business.lastUpdated = metabaseMarketShare.fetchedAt;
    data.asOf = metabaseMarketShare.fetchedAt;
  }

  if (defillamaData) {
    const weeklyKpi = data.sections.defi.kpis.find((item) => item.id === "weekly-perp-volume");
    if (weeklyKpi && defillamaData.weeklyPerpVolume !== undefined) {
      weeklyKpi.value = formatMoney(defillamaData.weeklyPerpVolume, 1);
      weeklyKpi.source = "auto";
    }

    const rankKpi = data.sections.defi.kpis.find((item) => item.id === "orderly-rank");
    if (rankKpi && defillamaData.orderlyRank30d !== undefined) {
      rankKpi.value = asRank(defillamaData.orderlyRank30d);
      rankKpi.source = "auto";
    }

    if (defillamaData.top3 && defillamaData.top3.length > 0) {
      data.sections.defi.leaderboard = defillamaData.top3.map((item) => ({
        name: item.name,
        volume: formatMoney(item.volume30d, 1)
      }));
    }

    data.sections.defi.lastUpdated = defillamaData.fetchedAt;
    data.asOf = defillamaData.fetchedAt;
  }

  if (orderlyDexData) {
    const totalKpi = data.sections.ecosystem.kpis.find((item) => item.id === "total-dexs");
    if (totalKpi && orderlyDexData.totalDexs !== undefined) {
      totalKpi.value = orderlyDexData.totalDexs.toLocaleString();
      totalKpi.source = "auto";
    }

    const gradKpi = data.sections.ecosystem.kpis.find((item) => item.id === "graduated-dexs");
    if (gradKpi && orderlyDexData.graduatedDexs !== undefined) {
      gradKpi.value = orderlyDexData.graduatedDexs.toLocaleString();
      gradKpi.source = "auto";
    }

    data.sections.ecosystem.lastUpdated = orderlyDexData.fetchedAt;
    data.asOf = orderlyDexData.fetchedAt;
  }

  applyHistoryOverlay(data, history);

  const fallback = await readManualFallback();
  const shouldApplyManualMarketShare = !metabaseMarketShare || process.env.FORCE_MANUAL_MARKET_SHARE === "true";

  if (fallback.marketShare && shouldApplyManualMarketShare) {
    const kpi = data.sections.business.kpis.find((item) => item.id === "market-share");
    if (kpi) {
      const deltaValue = fallback.marketShare.delta;
      kpi.value = `${fallback.marketShare.current.toFixed(2)}%`;
      kpi.delta = {
        value: `${deltaValue > 0 ? "+" : ""}${deltaValue.toFixed(2)}%`,
        direction: deltaValue > 0 ? "up" : deltaValue < 0 ? "down" : "flat",
        label: "WoW"
      };
      kpi.source = "manual";
    }

    if (fallback.marketShare.trend.length > 0) {
      const size = fallback.marketShare.trend.length;
      data.sections.business.marketShareTrend = fallback.marketShare.trend.map((value, index) => ({
        label: index === size - 1 ? "Now" : `W-${size - 1 - index}`,
        value
      }));
    }

    if (fallback.updatedAt) {
      data.sections.business.lastUpdated = fallback.updatedAt;
      data.asOf = fallback.updatedAt;
    }
  }

  return data;
}

export const getDashboardData = unstable_cache(getDashboardDataUncached, ["dashboard-data"], {
  revalidate: DAY_SECONDS,
  tags: ["dashboard-data"]
});
