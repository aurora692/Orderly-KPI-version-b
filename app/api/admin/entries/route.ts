import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { persistManualFallbackFromEntry } from "@/lib/manual-fallback-store";
import { AdminEntryInput } from "@/lib/types";

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return true;
  return request.headers.get("x-admin-password") === expected;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as Partial<AdminEntryInput>;

  if (!payload.date || payload.total_perp_volume_7d === undefined || !payload.top3_name_1) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (
    (payload.market_share_current !== undefined && Number.isNaN(Number(payload.market_share_current))) ||
    (payload.market_share_delta !== undefined && Number.isNaN(Number(payload.market_share_delta))) ||
    (payload.market_share_trend !== undefined &&
      (!Array.isArray(payload.market_share_trend) ||
        payload.market_share_trend.some((item) => Number.isNaN(Number(item)))))
  ) {
    return NextResponse.json({ error: "Invalid market share fallback fields" }, { status: 400 });
  }

  const arrayFields: Array<keyof AdminEntryInput> = [
    "avg_daily_volume_trend",
    "avg_daily_volume_monthly_trend",
    "revenue_day_trend",
    "new_users_trend",
    "active_users_trend",
    "stake_users_trend",
    "staked_vs_supply_trend",
    "omnivault_tvl_trend",
    "volume_segments_2b_trend",
    "volume_segments_2c_trend",
    "volume_segments_mm_trend",
    "omnivault_vault_a_trend",
    "omnivault_vault_b_trend",
    "omnivault_vault_c_trend"
  ];
  const numberFields: Array<keyof AdminEntryInput> = [
    "avg_daily_volume_current_m",
    "avg_daily_volume_delta_pct",
    "revenue_day_current_k",
    "revenue_day_delta_pct",
    "new_users_current",
    "new_users_delta_pct",
    "active_users_current",
    "active_users_delta_pct",
    "stake_users_current",
    "stake_users_delta_pct",
    "staked_vs_supply_current_pct",
    "staked_vs_supply_delta_pct",
    "omnivault_tvl_current_m",
    "omnivault_tvl_delta_pct",
    "volume_segments_1k_pct",
    "volume_segments_3c_pct",
    "volume_segments_mm_pct"
  ];

  const invalidArray = arrayFields.find((key) => {
    const value = payload[key];
    return value !== undefined && (!Array.isArray(value) || value.some((item) => Number.isNaN(Number(item))));
  });
  if (invalidArray) {
    return NextResponse.json({ error: `Invalid array field: ${invalidArray}` }, { status: 400 });
  }

  const invalidNumber = numberFields.find((key) => {
    const value = payload[key];
    return value !== undefined && Number.isNaN(Number(value));
  });
  if (invalidNumber) {
    return NextResponse.json({ error: `Invalid numeric field: ${invalidNumber}` }, { status: 400 });
  }

  const persistResult = await persistManualFallbackFromEntry(payload);
  revalidateTag("dashboard-data");

  return NextResponse.json({ ok: true, received: payload, persistence: persistResult });
}
