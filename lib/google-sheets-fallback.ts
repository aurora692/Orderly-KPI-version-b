import { google, sheets_v4 } from "googleapis";

type CsvList = number[];

export type MarketShareFallback = {
  current: number;
  delta: number;
  trend: CsvList;
  source: "manual" | "auto";
};

export type BusinessManualFallback = {
  marketShare?: MarketShareFallback;
  avgDailyVolumeCurrentM?: number;
  avgDailyVolumeDeltaPct?: number;
  avgDailyVolumeTrend?: CsvList;
  avgDailyVolumeMonthlyTrend?: CsvList;
  revenueDayCurrentK?: number;
  revenueDayDeltaPct?: number;
  revenueDayTrend?: CsvList;
  newUsersCurrent?: number;
  newUsersDeltaPct?: number;
  newUsersTrend?: CsvList;
  activeUsersCurrent?: number;
  activeUsersDeltaPct?: number;
  activeUsersTrend?: CsvList;
  stakeUsersCurrent?: number;
  stakeUsersDeltaPct?: number;
  stakeUsersTrend?: CsvList;
  stakedVsSupplyCurrentPct?: number;
  stakedVsSupplyDeltaPct?: number;
  stakedVsSupplyTrend?: CsvList;
  omnivaultTvlCurrentM?: number;
  omnivaultTvlDeltaPct?: number;
  omnivaultTvlTrend?: CsvList;
  volumeSegments1kPct?: number;
  volumeSegments3cPct?: number;
  volumeSegmentsMmPct?: number;
  volumeSegments2bTrend?: CsvList;
  volumeSegments2cTrend?: CsvList;
  volumeSegmentsMmTrend?: CsvList;
  omnivaultVaultATrend?: CsvList;
  omnivaultVaultBTrend?: CsvList;
  omnivaultVaultCTrend?: CsvList;
  source: "manual" | "auto";
};

export type ManualFallbackData = {
  updatedAt?: string;
  marketShare?: MarketShareFallback;
  business?: BusinessManualFallback;
};

export type SheetsWriteResult = {
  ok: boolean;
  error?: string;
};

const DEFAULT_TAB = "manual_fallback";
const HEADER_ROW = [
  "updated_at",
  "source",
  "market_share_current",
  "market_share_delta",
  "market_share_trend_csv",
  "avg_daily_volume_current_m",
  "avg_daily_volume_delta_pct",
  "avg_daily_volume_trend_csv",
  "revenue_day_current_k",
  "revenue_day_delta_pct",
  "revenue_day_trend_csv",
  "new_users_current",
  "new_users_delta_pct",
  "new_users_trend_csv",
  "active_users_current",
  "active_users_delta_pct",
  "active_users_trend_csv",
  "stake_users_current",
  "stake_users_delta_pct",
  "stake_users_trend_csv",
  "staked_vs_supply_current_pct",
  "staked_vs_supply_delta_pct",
  "staked_vs_supply_trend_csv",
  "omnivault_tvl_current_m",
  "omnivault_tvl_delta_pct",
  "omnivault_tvl_trend_csv",
  "volume_segments_1k_pct",
  "volume_segments_3c_pct",
  "volume_segments_mm_pct",
  "volume_segments_2b_trend_csv",
  "volume_segments_2c_trend_csv",
  "volume_segments_mm_trend_csv",
  "omnivault_vault_a_trend_csv",
  "omnivault_vault_b_trend_csv",
  "omnivault_vault_c_trend_csv",
  "avg_daily_volume_monthly_trend_csv"
];

function getSheetId(): string | null {
  return process.env.GOOGLE_SHEETS_ID || null;
}

function getTabName(): string {
  return process.env.GOOGLE_SHEETS_MANUAL_TAB || DEFAULT_TAB;
}

function parseServiceAccountKey(): Record<string, unknown> | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;

  try {
    const normalized = raw.trim().replace(/^'/, "").replace(/'$/, "");
    const key = JSON.parse(normalized) as Record<string, unknown>;
    if (typeof key.private_key === "string") {
      key.private_key = key.private_key.replace(/\\n/g, "\n");
    }
    return key;
  } catch {
    return null;
  }
}

function isConfigured(): boolean {
  return Boolean(getSheetId() && parseServiceAccountKey());
}

async function getClient(): Promise<sheets_v4.Sheets | null> {
  const credentials = parseServiceAccountKey();
  const spreadsheetId = getSheetId();
  if (!credentials || !spreadsheetId) return null;

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  return google.sheets({ version: "v4", auth });
}

async function ensureManualTab(client: sheets_v4.Sheets, spreadsheetId: string, tabName: string): Promise<void> {
  const metadata = await client.spreadsheets.get({ spreadsheetId });
  const exists = metadata.data.sheets?.some((sheet) => sheet.properties?.title === tabName);
  if (exists) return;

  await client.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: tabName } } }]
    }
  });
}

function parseNum(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const v = Number(raw);
  return Number.isNaN(v) ? undefined : v;
}

function parseCsv(raw: string | undefined): number[] | undefined {
  if (!raw) return undefined;
  const parsed = raw
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => !Number.isNaN(item));
  return parsed.length ? parsed : undefined;
}

function toCsv(values?: number[]): string {
  return values && values.length ? values.join(",") : "";
}

function parseLegacyRow(row: string[]): ManualFallbackData {
  const updatedAt = String(row[0] ?? "").trim();
  const current = parseNum(row[1]);
  const delta = parseNum(row[2]);
  const trend = parseCsv(String(row[3] ?? ""));
  const source = String(row[4] ?? "manual") === "auto" ? "auto" : "manual";

  if (current === undefined || delta === undefined) return {};
  return {
    updatedAt: updatedAt || undefined,
    marketShare: { current, delta, trend: trend ?? [], source },
    business: { source }
  };
}

export async function readManualFallbackFromSheets(): Promise<ManualFallbackData | null> {
  if (!isConfigured()) return null;

  const spreadsheetId = getSheetId();
  const tabName = getTabName();
  const client = await getClient();
  if (!client || !spreadsheetId) return null;

  try {
    const response = await client.spreadsheets.values.get({
      spreadsheetId,
      range: `${tabName}!A2:AJ2`
    });

    const row = response.data.values?.[0];
    if (!row || row.length === 0) return {};
    if (row.length <= 5) return parseLegacyRow(row);

    const updatedAt = String(row[0] ?? "").trim();
    const source = String(row[1] ?? "manual") === "auto" ? "auto" : "manual";

    const marketShareCurrent = parseNum(row[2]);
    const marketShareDelta = parseNum(row[3]);

    const data: ManualFallbackData = {
      updatedAt: updatedAt || undefined,
      business: {
        source,
        avgDailyVolumeCurrentM: parseNum(row[5]),
        avgDailyVolumeDeltaPct: parseNum(row[6]),
        avgDailyVolumeTrend: parseCsv(row[7]),
        avgDailyVolumeMonthlyTrend: parseCsv(row[35]),
        revenueDayCurrentK: parseNum(row[8]),
        revenueDayDeltaPct: parseNum(row[9]),
        revenueDayTrend: parseCsv(row[10]),
        newUsersCurrent: parseNum(row[11]),
        newUsersDeltaPct: parseNum(row[12]),
        newUsersTrend: parseCsv(row[13]),
        activeUsersCurrent: parseNum(row[14]),
        activeUsersDeltaPct: parseNum(row[15]),
        activeUsersTrend: parseCsv(row[16]),
        stakeUsersCurrent: parseNum(row[17]),
        stakeUsersDeltaPct: parseNum(row[18]),
        stakeUsersTrend: parseCsv(row[19]),
        stakedVsSupplyCurrentPct: parseNum(row[20]),
        stakedVsSupplyDeltaPct: parseNum(row[21]),
        stakedVsSupplyTrend: parseCsv(row[22]),
        omnivaultTvlCurrentM: parseNum(row[23]),
        omnivaultTvlDeltaPct: parseNum(row[24]),
        omnivaultTvlTrend: parseCsv(row[25]),
        volumeSegments1kPct: parseNum(row[26]),
        volumeSegments3cPct: parseNum(row[27]),
        volumeSegmentsMmPct: parseNum(row[28]),
        volumeSegments2bTrend: parseCsv(row[29]),
        volumeSegments2cTrend: parseCsv(row[30]),
        volumeSegmentsMmTrend: parseCsv(row[31]),
        omnivaultVaultATrend: parseCsv(row[32]),
        omnivaultVaultBTrend: parseCsv(row[33]),
        omnivaultVaultCTrend: parseCsv(row[34])
      }
    };

    if (marketShareCurrent !== undefined && marketShareDelta !== undefined) {
      data.marketShare = {
        current: marketShareCurrent,
        delta: marketShareDelta,
        trend: parseCsv(row[4]) ?? [],
        source
      };
    }

    return data;
  } catch (error) {
    console.error("Failed to read manual fallback from Google Sheets", error);
    return null;
  }
}

export async function writeManualFallbackToSheets(data: ManualFallbackData): Promise<SheetsWriteResult> {
  if (!isConfigured()) {
    return { ok: false, error: "Google Sheets is not configured" };
  }
  if (!data.business && !data.marketShare) {
    return { ok: false, error: "No manual fallback data to write" };
  }

  const spreadsheetId = getSheetId();
  const tabName = getTabName();
  const client = await getClient();
  if (!client || !spreadsheetId) {
    return { ok: false, error: "Unable to initialize Google Sheets client" };
  }

  try {
    await ensureManualTab(client, spreadsheetId, tabName);

    const source = data.business?.source ?? data.marketShare?.source ?? "manual";

    const row = [
      data.updatedAt ?? new Date().toISOString(),
      source,
      data.marketShare?.current?.toString() ?? "",
      data.marketShare?.delta?.toString() ?? "",
      toCsv(data.marketShare?.trend),
      data.business?.avgDailyVolumeCurrentM?.toString() ?? "",
      data.business?.avgDailyVolumeDeltaPct?.toString() ?? "",
      toCsv(data.business?.avgDailyVolumeTrend),
      data.business?.revenueDayCurrentK?.toString() ?? "",
      data.business?.revenueDayDeltaPct?.toString() ?? "",
      toCsv(data.business?.revenueDayTrend),
      data.business?.newUsersCurrent?.toString() ?? "",
      data.business?.newUsersDeltaPct?.toString() ?? "",
      toCsv(data.business?.newUsersTrend),
      data.business?.activeUsersCurrent?.toString() ?? "",
      data.business?.activeUsersDeltaPct?.toString() ?? "",
      toCsv(data.business?.activeUsersTrend),
      data.business?.stakeUsersCurrent?.toString() ?? "",
      data.business?.stakeUsersDeltaPct?.toString() ?? "",
      toCsv(data.business?.stakeUsersTrend),
      data.business?.stakedVsSupplyCurrentPct?.toString() ?? "",
      data.business?.stakedVsSupplyDeltaPct?.toString() ?? "",
      toCsv(data.business?.stakedVsSupplyTrend),
      data.business?.omnivaultTvlCurrentM?.toString() ?? "",
      data.business?.omnivaultTvlDeltaPct?.toString() ?? "",
      toCsv(data.business?.omnivaultTvlTrend),
      data.business?.volumeSegments1kPct?.toString() ?? "",
      data.business?.volumeSegments3cPct?.toString() ?? "",
      data.business?.volumeSegmentsMmPct?.toString() ?? "",
      toCsv(data.business?.volumeSegments2bTrend),
      toCsv(data.business?.volumeSegments2cTrend),
      toCsv(data.business?.volumeSegmentsMmTrend),
      toCsv(data.business?.omnivaultVaultATrend),
      toCsv(data.business?.omnivaultVaultBTrend),
      toCsv(data.business?.omnivaultVaultCTrend),
      toCsv(data.business?.avgDailyVolumeMonthlyTrend)
    ];

    await client.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabName}!A1:AJ2`,
      valueInputOption: "RAW",
      requestBody: {
        values: [HEADER_ROW, row]
      }
    });

    return { ok: true };
  } catch (error) {
    console.error("Failed to write manual fallback to Google Sheets", error);
    return { ok: false, error: error instanceof Error ? error.message : "Unknown Sheets write error" };
  }
}
