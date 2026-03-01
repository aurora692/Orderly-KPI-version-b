import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { upsertHistorySnapshot } from "@/lib/google-sheets-history";
import { getDashboardData } from "@/lib/dashboard-service";

function parseDisplayNumber(value: string): number | undefined {
  const trimmed = value.replace(/[,#\s]/g, "");
  if (!trimmed) return undefined;

  const suffix = trimmed.slice(-1).toUpperCase();
  const base = Number(trimmed.replace(/[$%BMK]/gi, ""));
  if (Number.isNaN(base)) return undefined;

  if (suffix === "B") return base * 1_000_000_000;
  if (suffix === "M") return base * 1_000_000;
  if (suffix === "K") return base * 1_000;
  return base;
}

export async function GET() {
  const data = await getDashboardData();

  const weeklyPerp = data.sections.defi.kpis.find((item) => item.id === "weekly-perp-volume")?.value;
  const orderlyRank = data.sections.defi.kpis.find((item) => item.id === "orderly-rank")?.value;
  const orderPrice = data.sections.token.kpis.find((item) => item.id === "order-price")?.value;
  const cmcRank = data.sections.token.kpis.find((item) => item.id === "cmc-rank")?.value;
  const totalDexs = data.sections.ecosystem.kpis.find((item) => item.id === "total-dexs")?.value;
  const graduatedDexs = data.sections.ecosystem.kpis.find((item) => item.id === "graduated-dexs")?.value;

  const leaderboard = data.sections.defi.leaderboard;

  const snapshotResult = await upsertHistorySnapshot({
    date: new Date().toISOString().slice(0, 10),
    total_perp_volume_7d: weeklyPerp ? parseDisplayNumber(weeklyPerp) : undefined,
    orderly_rank_30d: orderlyRank ? parseDisplayNumber(orderlyRank) : undefined,
    top3_name_1: leaderboard[0]?.name,
    top3_vol_1: leaderboard[0]?.volume ? parseDisplayNumber(leaderboard[0].volume) : undefined,
    top3_name_2: leaderboard[1]?.name,
    top3_vol_2: leaderboard[1]?.volume ? parseDisplayNumber(leaderboard[1].volume) : undefined,
    top3_name_3: leaderboard[2]?.name,
    top3_vol_3: leaderboard[2]?.volume ? parseDisplayNumber(leaderboard[2].volume) : undefined,
    order_price: orderPrice ? parseDisplayNumber(orderPrice) : undefined,
    order_cmc_rank: cmcRank ? parseDisplayNumber(cmcRank) : undefined,
    total_dexs: totalDexs ? parseDisplayNumber(totalDexs) : undefined,
    graduated_dexs: graduatedDexs ? parseDisplayNumber(graduatedDexs) : undefined,
    source: "auto"
  });

  revalidateTag("dashboard-data");

  return NextResponse.json({
    ok: true,
    message: "Dashboard cache refresh triggered.",
    snapshot: snapshotResult
  });
}
