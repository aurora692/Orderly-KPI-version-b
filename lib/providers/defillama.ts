export type DefiLlamaPerpsData = {
  weeklyPerpVolume?: number;
  orderlyRank30d?: number;
  orderlyVolume30d?: number;
  top3?: Array<{ name: string; volume30d: number }>;
  fetchedAt: string;
};

function pickNumber(input: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = input[key];
    if (typeof value === "number" && !Number.isNaN(value)) {
      return value;
    }
  }
  return undefined;
}

function parseTop3(payload: unknown): Array<{ name: string; volume30d: number }> {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown })?.data)
      ? ((payload as { data: unknown[] }).data ?? [])
      : [];

  const parsed = rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const record = row as Record<string, unknown>;
      const name =
        (typeof record.project === "string" && record.project) ||
        (typeof record.name === "string" && record.name) ||
        (typeof record.protocol === "string" && record.protocol) ||
        "";
      const volume30d = pickNumber(record, ["reportedVolume30d", "volume30d", "volume_30d", "monthlyVolume"]);
      if (!name || volume30d === undefined) return null;
      return { name, volume30d };
    })
    .filter((item): item is { name: string; volume30d: number } => Boolean(item))
    .sort((a, b) => b.volume30d - a.volume30d);

  return parsed.slice(0, 3);
}

function parseOrderlyRank(
  orderlyName: string,
  fullList: Array<{ name: string; volume30d: number }>
): {
  rank?: number;
  volume?: number;
} {
  const normalizedTarget = orderlyName.trim().toLowerCase();
  const exactIndex = fullList.findIndex((item) => item.name.trim().toLowerCase() === normalizedTarget);
  const orderlyIndex =
    exactIndex >= 0
      ? exactIndex
      : fullList.findIndex((item) => item.name.trim().toLowerCase().includes(normalizedTarget));
  if (orderlyIndex < 0) return {};
  return {
    rank: orderlyIndex + 1,
    volume: fullList[orderlyIndex].volume30d
  };
}

export async function fetchDefiLlamaPerpsData(): Promise<DefiLlamaPerpsData | null> {
  const overviewUrl =
    process.env.DEFILLAMA_OVERVIEW_URL ||
    "https://api.llama.fi/overview/derivatives?excludeTotalDataChart=false&excludeTotalDataChartBreakdown=true";
  const rankingsUrl = process.env.DEFILLAMA_RANKINGS_URL || "https://api.llama.fi/summary/derivatives";
  const orderlyName = process.env.DEFILLAMA_ORDERLY_NAME || "Orderly";

  try {
    const [overviewRes, rankingRes] = await Promise.all([
      fetch(overviewUrl, { next: { revalidate: 60 * 60 } }),
      fetch(rankingsUrl, { next: { revalidate: 60 * 60 } })
    ]);

    if (!overviewRes.ok && !rankingRes.ok) {
      return null;
    }

    const overviewPayload = overviewRes.ok ? ((await overviewRes.json()) as Record<string, unknown>) : {};
    const rankingPayload = rankingRes.ok ? await rankingRes.json() : [];

    const weeklyPerpVolume =
      pickNumber(overviewPayload, ["total7d", "totalWeeklyVolume", "weeklyVolume", "total24h"]) ??
      (() => {
        const chart = overviewPayload.totalDataChart;
        if (!Array.isArray(chart) || chart.length === 0) return undefined;
        const last = chart[chart.length - 1];
        if (!Array.isArray(last) || typeof last[1] !== "number") return undefined;
        return last[1];
      })();

    const top3 = parseTop3(rankingPayload);
    const fullList = (() => {
      const rows = Array.isArray(rankingPayload)
        ? rankingPayload
        : Array.isArray((rankingPayload as { data?: unknown })?.data)
          ? ((rankingPayload as { data: unknown[] }).data ?? [])
          : [];
      return rows
        .map((row) => {
          if (!row || typeof row !== "object") return null;
          const record = row as Record<string, unknown>;
          const name =
            (typeof record.project === "string" && record.project) ||
            (typeof record.name === "string" && record.name) ||
            (typeof record.protocol === "string" && record.protocol) ||
            "";
          const volume30d = pickNumber(record, ["reportedVolume30d", "volume30d", "volume_30d", "monthlyVolume"]);
          if (!name || volume30d === undefined) return null;
          return { name, volume30d };
        })
        .filter((item): item is { name: string; volume30d: number } => Boolean(item))
        .sort((a, b) => b.volume30d - a.volume30d);
    })();

    const orderly = parseOrderlyRank(orderlyName, fullList);

    return {
      weeklyPerpVolume,
      orderlyRank30d: orderly.rank,
      orderlyVolume30d: orderly.volume,
      top3,
      fetchedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("DefiLlama fetch failed", error);
    return null;
  }
}
