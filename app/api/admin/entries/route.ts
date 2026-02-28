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

  const persistResult = await persistManualFallbackFromEntry(payload);
  revalidateTag("dashboard-data");

  return NextResponse.json({ ok: true, received: payload, persistence: persistResult });
}
