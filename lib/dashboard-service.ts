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
    label: point.date,
    value: point.value
  }));
}

function applyHistoryOverlay(
  data: DashboardData,
  history: Awaited<ReturnType<typeof readHistorySnapshots>>,
  options: {
    useHistoryForDefiCurrent: boolean;
    useHistoryForEcosystemCurrent: boolean;
  }
) {
  if (history.length === 0) return;

  const findLatestIndex = <T>(selector: (row: (typeof history)[number]) => T | undefined): number =>
    [...history].reverse().findIndex((row) => selector(row) !== undefined);
  const fromReverseIndex = (reverseIndex: number): number =>
    reverseIndex < 0 ? -1 : history.length - 1 - reverseIndex;
  const latestWith = <T>(selector: (row: (typeof history)[number]) => T | undefined) => {
    const idx = fromReverseIndex(findLatestIndex(selector));
    return idx >= 0 ? { row: history[idx], index: idx } : null;
  };
  const previousWith = <T>(selector: (row: (typeof history)[number]) => T | undefined, beforeIndex: number) => {
    for (let i = beforeIndex - 1; i >= 0; i -= 1) {
      if (selector(history[i]) !== undefined) return history[i];
    }
    return undefined;
  };
  const latestAny = history[history.length - 1];

  const latestPerp = latestWith((row) => row.total_perp_volume_7d);
  data.sections.defi.trend6w = buildTrendFromHistory(
    history.map((item) => ({ date: item.date, value: item.total_perp_volume_7d ? item.total_perp_volume_7d / 1_000_000_000 : undefined })),
    6
  );
  if (latestPerp && options.useHistoryForDefiCurrent) {
    const kpi = data.sections.defi.kpis.find((item) => item.id === "weekly-perp-volume");
    if (kpi) {
      kpi.value = formatMoney(latestPerp.row.total_perp_volume_7d!, 1);
      const previous = previousWith((row) => row.total_perp_volume_7d, latestPerp.index);
      if (previous?.total_perp_volume_7d) {
        const wow = ((latestPerp.row.total_perp_volume_7d! - previous.total_perp_volume_7d) / previous.total_perp_volume_7d) * 100;
        if (kpi.delta) {
          applyDelta(kpi.delta, wow, "%");
          kpi.delta.label = "WoW";
        }
      }
      kpi.source = latestPerp.row.source ?? "auto";
    }
  }

  const latestRank = latestWith((row) => row.orderly_rank_30d);
  if (latestRank && options.useHistoryForDefiCurrent) {
    const kpi = data.sections.defi.kpis.find((item) => item.id === "orderly-rank");
    if (kpi) {
      kpi.value = asRank(latestRank.row.orderly_rank_30d!);
      const previous = previousWith((row) => row.orderly_rank_30d, latestRank.index);
      if (previous?.orderly_rank_30d !== undefined && kpi.delta) {
        const deltaRank = previous.orderly_rank_30d - latestRank.row.orderly_rank_30d!;
        applyDelta(kpi.delta, deltaRank, "");
        kpi.delta.label = "WoW";
      }
      kpi.source = latestRank.row.source ?? "auto";
    }

    data.sections.defi.rankTrend6w = buildTrendFromHistory(
      history.map((item) => ({ date: item.date, value: item.orderly_rank_30d })),
      6
    );
  }

  const latestTop3 = latestWith((row) => (row.top3_name_1 && row.top3_vol_1 !== undefined ? 1 : undefined));
  if (latestTop3 && options.useHistoryForDefiCurrent) {
    data.sections.defi.leaderboard = [
      { name: latestTop3.row.top3_name_1!, volume: formatMoney(latestTop3.row.top3_vol_1!, 1) },
      { name: latestTop3.row.top3_name_2 ?? "", volume: formatMoney(latestTop3.row.top3_vol_2 ?? 0, 1) },
      { name: latestTop3.row.top3_name_3 ?? "", volume: formatMoney(latestTop3.row.top3_vol_3 ?? 0, 1) }
    ].filter((row) => row.name);
  }

  const latestTotalDexs = latestWith((row) => row.total_dexs);
  if (latestTotalDexs && options.useHistoryForEcosystemCurrent) {
    const totalKpi = data.sections.ecosystem.kpis.find((item) => item.id === "total-dexs");
    if (totalKpi) {
      totalKpi.value = latestTotalDexs.row.total_dexs!.toLocaleString();
      const previous = previousWith((row) => row.total_dexs, latestTotalDexs.index);
      if (previous?.total_dexs !== undefined && totalKpi.delta) {
        applyDelta(totalKpi.delta, latestTotalDexs.row.total_dexs! - previous.total_dexs, "");
        totalKpi.delta.label = "WoW";
      }
      totalKpi.source = latestTotalDexs.row.source ?? "auto";
    }
  }

  const latestGraduated = latestWith((row) => row.graduated_dexs);
  if (latestGraduated && options.useHistoryForEcosystemCurrent) {
    const gradKpi = data.sections.ecosystem.kpis.find((item) => item.id === "graduated-dexs");
    if (gradKpi) {
      gradKpi.value = latestGraduated.row.graduated_dexs!.toLocaleString();
      const previous = previousWith((row) => row.graduated_dexs, latestGraduated.index);
      if (previous?.graduated_dexs !== undefined && gradKpi.delta) {
        applyDelta(gradKpi.delta, latestGraduated.row.graduated_dexs! - previous.graduated_dexs, "");
        gradKpi.delta.label = "WoW";
      }
      gradKpi.source = latestGraduated.row.source ?? "auto";
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
    .slice(-6)
    .map((item) => ({
      label: item.label,
      value: item.value
    }));

  if (latestAny.order_cmc_rank !== undefined) {
    data.sections.token.rankTrend6w = buildTrendFromHistory(
      history.map((item) => ({ date: item.date, value: item.order_cmc_rank })),
      6
    );
  }

  if (options.useHistoryForDefiCurrent && latestAny.date) {
    data.sections.defi.lastUpdated = `${latestAny.date}T00:00:00.000Z`;
  }
  if (options.useHistoryForEcosystemCurrent && latestAny.date) {
    data.sections.ecosystem.lastUpdated = `${latestAny.date}T00:00:00.000Z`;
  }
}

async function getDashboardDataUncached(): Promise<DashboardData> {
  const data: DashboardData = JSON.parse(JSON.stringify(mockDashboardData));
  const forceHistoryDefi = process.env.FORCE_HISTORY_DEFI === "true";
  const forceHistoryEcosystem = process.env.FORCE_HISTORY_ECOSYSTEM === "true";

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

  applyHistoryOverlay(data, history, {
    useHistoryForDefiCurrent: forceHistoryDefi || !defillamaData,
    useHistoryForEcosystemCurrent: forceHistoryEcosystem || !orderlyDexData
  });

  const fallback = await readManualFallback();
  const shouldApplyManualMarketShare = !metabaseMarketShare || process.env.FORCE_MANUAL_MARKET_SHARE === "true";
  const shouldApplyAllBusinessManual = process.env.FORCE_MANUAL_ALL_BUSINESS === "true";

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

  if (fallback.business && shouldApplyAllBusinessManual) {
    const b = fallback.business;
    const setBusinessKpi = (id: string, value?: string, delta?: number) => {
      if (value === undefined) return;
      const kpi = data.sections.business.kpis.find((item) => item.id === id);
      if (!kpi) return;
      kpi.value = value;
      if (typeof delta === "number") {
        kpi.delta = {
          value: `${delta > 0 ? "+" : ""}${delta.toFixed(2)}%`,
          direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
          label: "WoW"
        };
      }
      kpi.source = "manual";
    };

    setBusinessKpi("market-share", b.marketShare?.current !== undefined ? `${b.marketShare.current.toFixed(2)}%` : undefined, b.marketShare?.delta);
    setBusinessKpi(
      "avg-daily-volume",
      b.avgDailyVolumeCurrentM !== undefined ? `$${b.avgDailyVolumeCurrentM.toFixed(1)}M` : undefined,
      b.avgDailyVolumeDeltaPct
    );
    setBusinessKpi(
      "revenue-day",
      b.revenueDayCurrentK !== undefined ? `$${b.revenueDayCurrentK.toFixed(1)}K` : undefined,
      b.revenueDayDeltaPct
    );
    setBusinessKpi(
      "new-users",
      b.newUsersCurrent !== undefined ? Math.round(b.newUsersCurrent).toLocaleString() : undefined,
      b.newUsersDeltaPct
    );
    setBusinessKpi(
      "active-users",
      b.activeUsersCurrent !== undefined ? Math.round(b.activeUsersCurrent).toLocaleString() : undefined,
      b.activeUsersDeltaPct
    );
    setBusinessKpi(
      "stake-users",
      b.stakeUsersCurrent !== undefined ? Math.round(b.stakeUsersCurrent).toLocaleString() : undefined,
      b.stakeUsersDeltaPct
    );
    setBusinessKpi(
      "staked-vs-supply",
      b.stakedVsSupplyCurrentPct !== undefined ? `${b.stakedVsSupplyCurrentPct.toFixed(2)}%` : undefined,
      b.stakedVsSupplyDeltaPct
    );
    setBusinessKpi(
      "omnivault-tvl",
      b.omnivaultTvlCurrentM !== undefined ? `$${b.omnivaultTvlCurrentM.toFixed(1)}M` : undefined,
      b.omnivaultTvlDeltaPct
    );

    if (b.marketShare?.trend?.length) {
      const size = b.marketShare.trend.length;
      data.sections.business.marketShareTrend = b.marketShare.trend.map((value, index) => ({
        label: index === size - 1 ? "Now" : `W-${size - 1 - index}`,
        value
      }));
    }
    if (b.avgDailyVolumeTrend?.length) {
      const size = b.avgDailyVolumeTrend.length;
      data.sections.business.volumeTrend = b.avgDailyVolumeTrend.map((value, index) => ({
        label: index === size - 1 ? "Now" : `W-${size - 1 - index}`,
        value
      }));
    }
    if (b.avgDailyVolumeMonthlyTrend?.length) {
      const size = b.avgDailyVolumeMonthlyTrend.length;
      data.sections.business.volumeMonthlyTrend = b.avgDailyVolumeMonthlyTrend.map((value, index) => ({
        label: index === size - 1 ? "Now" : `M-${size - 1 - index}`,
        value
      }));
    }
    if (b.revenueDayTrend?.length) {
      const size = b.revenueDayTrend.length;
      data.sections.business.revenueTrend = b.revenueDayTrend.map((value, index) => ({
        label: index === size - 1 ? "Now" : `W-${size - 1 - index}`,
        value
      }));
    }
    if (b.newUsersTrend?.length) {
      const size = b.newUsersTrend.length;
      data.sections.business.userNewTrend = b.newUsersTrend.map((value, index) => ({
        label: index === size - 1 ? "Now" : `W-${size - 1 - index}`,
        value
      }));
    }
    if (b.activeUsersTrend?.length) {
      const size = b.activeUsersTrend.length;
      data.sections.business.userActiveTrend = b.activeUsersTrend.map((value, index) => ({
        label: index === size - 1 ? "Now" : `W-${size - 1 - index}`,
        value
      }));
    }
    if (b.stakeUsersTrend?.length) {
      const size = b.stakeUsersTrend.length;
      data.sections.business.stakeUsersTrend = b.stakeUsersTrend.map((value, index) => ({
        label: index === size - 1 ? "Now" : `W-${size - 1 - index}`,
        value
      }));
    }
    if (b.stakedVsSupplyTrend?.length) {
      const size = b.stakedVsSupplyTrend.length;
      data.sections.business.stakedVsSupplyTrend = b.stakedVsSupplyTrend.map((value, index) => ({
        label: index === size - 1 ? "Now" : `W-${size - 1 - index}`,
        value
      }));
    }
    if (b.omnivaultTvlTrend?.length && b.omnivaultVaultATrend?.length && b.omnivaultVaultBTrend?.length && b.omnivaultVaultCTrend?.length) {
      const size = Math.min(
        b.omnivaultTvlTrend.length,
        b.omnivaultVaultATrend.length,
        b.omnivaultVaultBTrend.length,
        b.omnivaultVaultCTrend.length
      );
      data.sections.business.omnivaultTrend = Array.from({ length: size }).map((_, index) => ({
        label: index === size - 1 ? "Now" : `W-${size - 1 - index}`,
        value: b.omnivaultVaultATrend![index],
        valueB: b.omnivaultVaultBTrend![index],
        valueC: b.omnivaultVaultCTrend![index]
      }));
    }

    if (b.volumeSegments2bTrend?.length && b.volumeSegments2cTrend?.length && b.volumeSegmentsMmTrend?.length) {
      const size = Math.min(b.volumeSegments2bTrend.length, b.volumeSegments2cTrend.length, b.volumeSegmentsMmTrend.length, 6);
      data.sections.business.segmentBreakdown = Array.from({ length: size }).map((_, index) => ({
        label: index === size - 1 ? "Now" : `W-${size - 1 - index}`,
        value: b.volumeSegments2bTrend![index],
        valueB: b.volumeSegments2cTrend![index],
        valueC: b.volumeSegmentsMmTrend![index]
      }));
    } else if (
      b.volumeSegments1kPct !== undefined &&
      b.volumeSegments3cPct !== undefined &&
      b.volumeSegmentsMmPct !== undefined
    ) {
      data.sections.business.segmentBreakdown = [
        {
          label: "Now",
          value: b.volumeSegments1kPct,
          valueB: b.volumeSegments3cPct,
          valueC: b.volumeSegmentsMmPct
        }
      ];
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
