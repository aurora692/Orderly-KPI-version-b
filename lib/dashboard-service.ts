import { unstable_cache } from "next/cache";
import { formatCmcDelta, fetchCmcOrderlyTokenData } from "@/lib/providers/cmc";
import { fetchMetabaseMarketShareData, formatMetabaseDelta } from "@/lib/providers/metabase";
import { mockDashboardData } from "@/lib/mock-data";
import { DashboardData } from "@/lib/types";
import { readManualFallback } from "@/lib/manual-fallback-store";

const DAY_SECONDS = 60 * 60 * 24;

async function getDashboardDataUncached(): Promise<DashboardData> {
  const data: DashboardData = JSON.parse(JSON.stringify(mockDashboardData));

  const [cmcData, metabaseMarketShare] = await Promise.all([
    fetchCmcOrderlyTokenData(),
    fetchMetabaseMarketShareData()
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
