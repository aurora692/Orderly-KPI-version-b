import { google, sheets_v4 } from "googleapis";

export type MarketShareFallback = {
  current: number;
  delta: number;
  trend: number[];
  source: "manual" | "auto";
};

export type ManualFallbackData = {
  updatedAt?: string;
  marketShare?: MarketShareFallback;
};

export type SheetsWriteResult = {
  ok: boolean;
  error?: string;
};

const DEFAULT_TAB = "manual_fallback";
const HEADER_ROW = ["updated_at", "market_share_current", "market_share_delta", "market_share_trend_csv", "source"];

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

export async function readManualFallbackFromSheets(): Promise<ManualFallbackData | null> {
  if (!isConfigured()) return null;

  const spreadsheetId = getSheetId();
  const tabName = getTabName();
  const client = await getClient();
  if (!client || !spreadsheetId) return null;

  try {
    const response = await client.spreadsheets.values.get({
      spreadsheetId,
      range: `${tabName}!A2:E2`
    });

    const row = response.data.values?.[0];
    if (!row || row.length < 5) return {};

    const updatedAt = String(row[0] ?? "").trim();
    const current = Number(row[1]);
    const delta = Number(row[2]);
    const trendCsv = String(row[3] ?? "");
    const source = String(row[4] ?? "manual") === "auto" ? "auto" : "manual";

    if (Number.isNaN(current) || Number.isNaN(delta)) {
      return {};
    }

    const trend = trendCsv
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => !Number.isNaN(item));

    return {
      updatedAt: updatedAt || undefined,
      marketShare: {
        current,
        delta,
        trend,
        source
      }
    };
  } catch (error) {
    console.error("Failed to read manual fallback from Google Sheets", error);
    return null;
  }
}

export async function writeManualFallbackToSheets(data: ManualFallbackData): Promise<SheetsWriteResult> {
  if (!isConfigured()) {
    return { ok: false, error: "Google Sheets is not configured" };
  }
  if (!data.marketShare) {
    return { ok: false, error: "No market share data to write" };
  }

  const spreadsheetId = getSheetId();
  const tabName = getTabName();
  const client = await getClient();
  if (!client || !spreadsheetId) {
    return { ok: false, error: "Unable to initialize Google Sheets client" };
  }

  try {
    await ensureManualTab(client, spreadsheetId, tabName);

    const row = [
      data.updatedAt ?? new Date().toISOString(),
      String(data.marketShare.current),
      String(data.marketShare.delta),
      data.marketShare.trend.join(","),
      data.marketShare.source
    ];

    await client.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabName}!A1:E2`,
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
