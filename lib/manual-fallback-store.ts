import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  ManualFallbackData,
  MarketShareFallback,
  readManualFallbackFromSheets,
  writeManualFallbackToSheets
} from "@/lib/google-sheets-fallback";
import { AdminEntryInput } from "@/lib/types";

const STORE_FILE = process.env.VERCEL
  ? path.join("/tmp", "manual-fallback.json")
  : path.join(process.cwd(), "data", "manual-fallback.json");

export type FallbackPersistResult = {
  storage: "sheets" | "file-fallback" | "noop";
  sheetsError?: string;
};

export async function readManualFallback(): Promise<ManualFallbackData> {
  const fromSheets = await readManualFallbackFromSheets();
  if (fromSheets && fromSheets.marketShare) {
    return fromSheets;
  }

  try {
    const raw = await readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as ManualFallbackData;
    return parsed ?? {};
  } catch {
    return {};
  }
}

async function writeManualFallback(data: ManualFallbackData): Promise<void> {
  await mkdir(path.dirname(STORE_FILE), { recursive: true });
  await writeFile(STORE_FILE, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function persistManualFallbackFromEntry(
  payload: Partial<AdminEntryInput>
): Promise<FallbackPersistResult> {
  const current = await readManualFallback();

  if (payload.market_share_current === undefined && payload.market_share_trend === undefined) {
    return { storage: "noop" };
  }

  const prev = current.marketShare;
  const marketShare: MarketShareFallback = {
    current: payload.market_share_current ?? prev?.current ?? 0,
    delta: payload.market_share_delta ?? prev?.delta ?? 0,
    trend: payload.market_share_trend ?? prev?.trend ?? [],
    source: payload.source ?? prev?.source ?? "manual"
  };

  const nextData: ManualFallbackData = {
    ...current,
    updatedAt: new Date().toISOString(),
    marketShare
  };

  const sheetsResult = await writeManualFallbackToSheets(nextData);
  if (sheetsResult.ok) {
    return { storage: "sheets" };
  }

  await writeManualFallback(nextData);
  return { storage: "file-fallback", sheetsError: sheetsResult.error };
}
