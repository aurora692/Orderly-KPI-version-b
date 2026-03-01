import { getDeltaDirection } from "@/lib/format";

type CmcLiveTokenData = {
  price: number;
  cmcRank: number;
  percentChange24h?: number;
  fetchedAt: string;
};

const CMC_ENDPOINT = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest";

export async function fetchCmcOrderlyTokenData(): Promise<CmcLiveTokenData | null> {
  const apiKey = process.env.CMC_API_KEY;
  if (!apiKey) return null;

  const slug = process.env.CMC_ORDERLY_SLUG || "orderly-network";
  const url = `${CMC_ENDPOINT}?slug=${encodeURIComponent(slug)}`;

  try {
    const response = await fetch(url, {
      headers: {
        "X-CMC_PRO_API_KEY": apiKey,
        Accept: "application/json"
      },
      next: { revalidate: 60 * 60 }
    });

    if (!response.ok) {
      console.error("CoinMarketCap request failed", response.status, await response.text());
      return null;
    }

    const payload = (await response.json()) as {
      data?: Record<string, { cmc_rank?: number; quote?: { USD?: { price?: number; percent_change_24h?: number } } }>;
      status?: { timestamp?: string };
    };

    const first = payload.data ? Object.values(payload.data)[0] : undefined;
    const price = first?.quote?.USD?.price;
    const rank = first?.cmc_rank;

    if (typeof price !== "number" || typeof rank !== "number") {
      return null;
    }

    return {
      price,
      cmcRank: rank,
      percentChange24h: first?.quote?.USD?.percent_change_24h,
      fetchedAt: payload.status?.timestamp || new Date().toISOString()
    };
  } catch (error) {
    console.error("CoinMarketCap fetch failed", error);
    return null;
  }
}

export function formatCmcDelta(percentChange24h?: number):
  | { value: string; direction: "up" | "down" | "flat"; label: string }
  | undefined {
  if (typeof percentChange24h !== "number" || Number.isNaN(percentChange24h)) {
    return undefined;
  }

  return {
    value: `${percentChange24h > 0 ? "+" : ""}${percentChange24h.toFixed(2)}%`,
    direction: getDeltaDirection(percentChange24h),
    label: "24h"
  };
}
