export type OrderlyDexBoardData = {
  totalDexs?: number;
  graduatedDexs?: number;
  fetchedAt: string;
};

function pickNumber(payload: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number" && !Number.isNaN(value)) {
      return value;
    }
  }
  return undefined;
}

function parseFromText(html: string): { totalDexs?: number; graduatedDexs?: number } {
  const totalMatch = html.match(/Total\s*DEXs[^0-9]*([0-9]{1,5})/i);
  const gradMatch = html.match(/Graduated[^0-9]*([0-9]{1,5})/i);
  return {
    totalDexs: totalMatch ? Number(totalMatch[1]) : undefined,
    graduatedDexs: gradMatch ? Number(gradMatch[1]) : undefined
  };
}

export async function fetchOrderlyDexBoardData(): Promise<OrderlyDexBoardData | null> {
  const apiUrl = process.env.ORDERLY_DEX_BOARD_API_URL;
  const boardUrl = process.env.ORDERLY_DEX_BOARD_URL || "https://dex.orderly.network/board";

  try {
    if (apiUrl) {
      const response = await fetch(apiUrl, { next: { revalidate: 60 * 60 } });
      if (!response.ok) return null;

      const payload = (await response.json()) as Record<string, unknown>;
      const totalDexs = pickNumber(payload, ["totalDexs", "total_dexs", "dexCount"]);
      const graduatedDexs = pickNumber(payload, ["graduatedDexs", "graduated_dexs", "graduatedCount"]);

      return {
        totalDexs,
        graduatedDexs,
        fetchedAt: new Date().toISOString()
      };
    }

    const response = await fetch(boardUrl, { next: { revalidate: 60 * 60 } });
    if (!response.ok) return null;

    const html = await response.text();
    const parsed = parseFromText(html);

    return {
      totalDexs: parsed.totalDexs,
      graduatedDexs: parsed.graduatedDexs,
      fetchedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Orderly DEX board fetch failed", error);
    return null;
  }
}
