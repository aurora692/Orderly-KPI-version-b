import { getDeltaDirection } from "@/lib/format";
import { SeriesPoint } from "@/lib/types";

type MetabaseMarketShareData = {
  trend: SeriesPoint[];
  current: number;
  delta: number;
  fetchedAt: string;
};

function getHeaders(token: string): Record<string, string> {
  const clean = token.trim().replace(/^['"]/, "").replace(/['"]$/, "");
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-api-key": clean,
    "X-Metabase-Session": clean
  };
}

function pickMarketShareValue(row: Record<string, unknown>): number | null {
  const preferred = [
    "Orderly Market Share",
    "orderly_market_share",
    "market_share",
    "value",
    "share"
  ];

  for (const key of preferred) {
    const value = row[key];
    if (typeof value === "number" && !Number.isNaN(value)) {
      return value;
    }
  }

  for (const [key, value] of Object.entries(row)) {
    const lower = key.toLowerCase();
    if (lower.includes("share") && typeof value === "number" && !Number.isNaN(value)) {
      return value;
    }
  }

  return null;
}

function sortByDateLikeLabel(points: SeriesPoint[]): SeriesPoint[] {
  return [...points].sort((a, b) => {
    const aTime = Date.parse(a.label);
    const bTime = Date.parse(b.label);
    if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) return aTime - bTime;
    return a.label.localeCompare(b.label);
  });
}

export async function fetchMetabaseMarketShareData(): Promise<MetabaseMarketShareData | null> {
  const baseUrl = process.env.METABASE_BASE_URL;
  const token = process.env.METABASE_API_TOKEN;
  const cardId = process.env.METABASE_CARD_MARKET_SHARE;

  if (!baseUrl || !token || !cardId) return null;

  const url = `${baseUrl.replace(/\/$/, "")}/api/card/${cardId}/query/json`;

  try {
    const postResponse = await fetch(url, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({ parameters: [] }),
      next: { revalidate: 60 * 60 }
    });

    const response = postResponse.ok
      ? postResponse
      : await fetch(url, {
          method: "GET",
          headers: getHeaders(token),
          next: { revalidate: 60 * 60 }
        });

    if (!response.ok) {
      console.error("Metabase request failed", response.status, await response.text());
      return null;
    }

    const payload = (await response.json()) as unknown;
    const rows = Array.isArray(payload)
      ? (payload as Array<Record<string, unknown>>)
      : Array.isArray((payload as { data?: unknown })?.data)
        ? ((payload as { data: Array<Record<string, unknown>> }).data ?? [])
        : [];
    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }

    const trend = rows
      .map((row, index) => {
        const rawLabel = row.week_start_date ?? row.week_start ?? row.date ?? row.label;
        const label = typeof rawLabel === "string" ? rawLabel : `row-${index + 1}`;
        const value = pickMarketShareValue(row);
        if (value === null) return null;
        return { label, value } satisfies SeriesPoint;
      })
      .filter((point): point is SeriesPoint => Boolean(point));

    if (trend.length < 1) return null;

    const normalizedTrend = trend.map((point) => ({
      ...point,
      // Some Metabase questions return ratio form (0.0022) for 0.22%.
      value: point.value <= 1 ? point.value * 100 : point.value
    }));

    const sorted = sortByDateLikeLabel(normalizedTrend);
    const current = sorted[sorted.length - 1].value;
    const previous = sorted.length > 1 ? sorted[sorted.length - 2].value : current;
    const delta = current - previous;

    return {
      trend: sorted,
      current,
      delta,
      fetchedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Metabase fetch failed", error);
    return null;
  }
}

export function formatMetabaseDelta(delta: number): {
  value: string;
  direction: "up" | "down" | "flat";
  label: string;
} {
  return {
    value: `${delta > 0 ? "+" : ""}${delta.toFixed(2)}%`,
    direction: getDeltaDirection(delta),
    label: "WoW"
  };
}
