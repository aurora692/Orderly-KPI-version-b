import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  BusinessManualFallback,
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

  const hasAnyManualBusinessInput = [
    payload.market_share_current,
    payload.market_share_delta,
    payload.market_share_trend,
    payload.avg_daily_volume_current_m,
    payload.avg_daily_volume_delta_pct,
    payload.avg_daily_volume_trend,
    payload.revenue_day_current_k,
    payload.revenue_day_delta_pct,
    payload.revenue_day_trend,
    payload.new_users_current,
    payload.new_users_delta_pct,
    payload.new_users_trend,
    payload.active_users_current,
    payload.active_users_delta_pct,
    payload.active_users_trend,
    payload.stake_users_current,
    payload.stake_users_delta_pct,
    payload.stake_users_trend,
    payload.staked_vs_supply_current_pct,
    payload.staked_vs_supply_delta_pct,
    payload.staked_vs_supply_trend,
    payload.omnivault_tvl_current_m,
    payload.omnivault_tvl_delta_pct,
    payload.omnivault_tvl_trend,
    payload.volume_segments_1k_pct,
    payload.volume_segments_3c_pct,
    payload.volume_segments_mm_pct,
    payload.volume_segments_2b_trend,
    payload.volume_segments_2c_trend,
    payload.volume_segments_mm_trend,
    payload.omnivault_vault_a_trend,
    payload.omnivault_vault_b_trend,
    payload.omnivault_vault_c_trend
  ].some((item) => item !== undefined);

  if (!hasAnyManualBusinessInput) {
    return { storage: "noop" };
  }

  const prev = current.marketShare;
  const hasMarketShareInput =
    payload.market_share_current !== undefined ||
    payload.market_share_delta !== undefined ||
    payload.market_share_trend !== undefined;
  const marketShare: MarketShareFallback | undefined = hasMarketShareInput || prev
    ? {
        current: payload.market_share_current ?? prev?.current ?? 0,
        delta: payload.market_share_delta ?? prev?.delta ?? 0,
        trend: payload.market_share_trend ?? prev?.trend ?? [],
        source: payload.source ?? prev?.source ?? "manual"
      }
    : undefined;

  const previousBusiness = current.business;
  const business: BusinessManualFallback = {
    source: payload.source ?? previousBusiness?.source ?? "manual",
    marketShare,
    avgDailyVolumeCurrentM: payload.avg_daily_volume_current_m ?? previousBusiness?.avgDailyVolumeCurrentM,
    avgDailyVolumeDeltaPct: payload.avg_daily_volume_delta_pct ?? previousBusiness?.avgDailyVolumeDeltaPct,
    avgDailyVolumeTrend: payload.avg_daily_volume_trend ?? previousBusiness?.avgDailyVolumeTrend,
    revenueDayCurrentK: payload.revenue_day_current_k ?? previousBusiness?.revenueDayCurrentK,
    revenueDayDeltaPct: payload.revenue_day_delta_pct ?? previousBusiness?.revenueDayDeltaPct,
    revenueDayTrend: payload.revenue_day_trend ?? previousBusiness?.revenueDayTrend,
    newUsersCurrent: payload.new_users_current ?? previousBusiness?.newUsersCurrent,
    newUsersDeltaPct: payload.new_users_delta_pct ?? previousBusiness?.newUsersDeltaPct,
    newUsersTrend: payload.new_users_trend ?? previousBusiness?.newUsersTrend,
    activeUsersCurrent: payload.active_users_current ?? previousBusiness?.activeUsersCurrent,
    activeUsersDeltaPct: payload.active_users_delta_pct ?? previousBusiness?.activeUsersDeltaPct,
    activeUsersTrend: payload.active_users_trend ?? previousBusiness?.activeUsersTrend,
    stakeUsersCurrent: payload.stake_users_current ?? previousBusiness?.stakeUsersCurrent,
    stakeUsersDeltaPct: payload.stake_users_delta_pct ?? previousBusiness?.stakeUsersDeltaPct,
    stakeUsersTrend: payload.stake_users_trend ?? previousBusiness?.stakeUsersTrend,
    stakedVsSupplyCurrentPct: payload.staked_vs_supply_current_pct ?? previousBusiness?.stakedVsSupplyCurrentPct,
    stakedVsSupplyDeltaPct: payload.staked_vs_supply_delta_pct ?? previousBusiness?.stakedVsSupplyDeltaPct,
    stakedVsSupplyTrend: payload.staked_vs_supply_trend ?? previousBusiness?.stakedVsSupplyTrend,
    omnivaultTvlCurrentM: payload.omnivault_tvl_current_m ?? previousBusiness?.omnivaultTvlCurrentM,
    omnivaultTvlDeltaPct: payload.omnivault_tvl_delta_pct ?? previousBusiness?.omnivaultTvlDeltaPct,
    omnivaultTvlTrend: payload.omnivault_tvl_trend ?? previousBusiness?.omnivaultTvlTrend,
    volumeSegments1kPct: payload.volume_segments_1k_pct ?? previousBusiness?.volumeSegments1kPct,
    volumeSegments3cPct: payload.volume_segments_3c_pct ?? previousBusiness?.volumeSegments3cPct,
    volumeSegmentsMmPct: payload.volume_segments_mm_pct ?? previousBusiness?.volumeSegmentsMmPct,
    volumeSegments2bTrend: payload.volume_segments_2b_trend ?? previousBusiness?.volumeSegments2bTrend,
    volumeSegments2cTrend: payload.volume_segments_2c_trend ?? previousBusiness?.volumeSegments2cTrend,
    volumeSegmentsMmTrend: payload.volume_segments_mm_trend ?? previousBusiness?.volumeSegmentsMmTrend,
    omnivaultVaultATrend: payload.omnivault_vault_a_trend ?? previousBusiness?.omnivaultVaultATrend,
    omnivaultVaultBTrend: payload.omnivault_vault_b_trend ?? previousBusiness?.omnivaultVaultBTrend,
    omnivaultVaultCTrend: payload.omnivault_vault_c_trend ?? previousBusiness?.omnivaultVaultCTrend
  };

  const nextData: ManualFallbackData = {
    ...current,
    updatedAt: new Date().toISOString(),
    marketShare,
    business
  };

  const sheetsResult = await writeManualFallbackToSheets(nextData);
  if (sheetsResult.ok) {
    return { storage: "sheets" };
  }

  await writeManualFallback(nextData);
  return { storage: "file-fallback", sheetsError: sheetsResult.error };
}
