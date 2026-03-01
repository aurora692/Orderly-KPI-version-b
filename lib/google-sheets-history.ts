import { google, sheets_v4 } from "googleapis";

export type HistorySnapshot = {
  date: string;
  total_perp_volume_7d?: number;
  orderly_rank_30d?: number;
  orderly_volume_30d?: number;
  top3_name_1?: string;
  top3_vol_1?: number;
  top3_name_2?: string;
  top3_vol_2?: number;
  top3_name_3?: string;
  top3_vol_3?: number;
  order_price?: number;
  order_cmc_rank?: number;
  total_dexs?: number;
  graduated_dexs?: number;
  source?: "auto" | "manual";
};

const DEFAULT_TAB = "kpi_history";
const HEADER_ROW = [
  "date",
  "total_perp_volume_7d",
  "orderly_rank_30d",
  "orderly_volume_30d",
  "top3_name_1",
  "top3_vol_1",
  "top3_name_2",
  "top3_vol_2",
  "top3_name_3",
  "top3_vol_3",
  "order_price",
  "order_cmc_rank",
  "total_dexs",
  "graduated_dexs",
  "source"
];

function getSheetId(): string | null {
  return process.env.GOOGLE_SHEETS_ID || null;
}

function getTabName(): string {
  return process.env.GOOGLE_SHEETS_HISTORY_TAB || DEFAULT_TAB;
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

async function ensureHistoryTab(client: sheets_v4.Sheets, spreadsheetId: string, tabName: string): Promise<void> {
  const metadata = await client.spreadsheets.get({ spreadsheetId });
  const exists = metadata.data.sheets?.some((sheet) => sheet.properties?.title === tabName);
  if (!exists) {
    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tabName } } }]
      }
    });
  }

  await client.spreadsheets.values.update({
    spreadsheetId,
    range: `${tabName}!A1:O1`,
    valueInputOption: "RAW",
    requestBody: { values: [HEADER_ROW] }
  });
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseRow(row: string[]): HistorySnapshot {
  return {
    date: row[0],
    total_perp_volume_7d: toNumber(row[1]),
    orderly_rank_30d: toNumber(row[2]),
    orderly_volume_30d: toNumber(row[3]),
    top3_name_1: row[4],
    top3_vol_1: toNumber(row[5]),
    top3_name_2: row[6],
    top3_vol_2: toNumber(row[7]),
    top3_name_3: row[8],
    top3_vol_3: toNumber(row[9]),
    order_price: toNumber(row[10]),
    order_cmc_rank: toNumber(row[11]),
    total_dexs: toNumber(row[12]),
    graduated_dexs: toNumber(row[13]),
    source: row[14] === "manual" ? "manual" : "auto"
  };
}

function toRow(snapshot: HistorySnapshot): string[] {
  return [
    snapshot.date,
    snapshot.total_perp_volume_7d?.toString() ?? "",
    snapshot.orderly_rank_30d?.toString() ?? "",
    snapshot.orderly_volume_30d?.toString() ?? "",
    snapshot.top3_name_1 ?? "",
    snapshot.top3_vol_1?.toString() ?? "",
    snapshot.top3_name_2 ?? "",
    snapshot.top3_vol_2?.toString() ?? "",
    snapshot.top3_name_3 ?? "",
    snapshot.top3_vol_3?.toString() ?? "",
    snapshot.order_price?.toString() ?? "",
    snapshot.order_cmc_rank?.toString() ?? "",
    snapshot.total_dexs?.toString() ?? "",
    snapshot.graduated_dexs?.toString() ?? "",
    snapshot.source ?? "auto"
  ];
}

export async function readHistorySnapshots(limit = 8): Promise<HistorySnapshot[]> {
  if (!isConfigured()) return [];

  const spreadsheetId = getSheetId();
  const tabName = getTabName();
  const client = await getClient();
  if (!client || !spreadsheetId) return [];

  try {
    const response = await client.spreadsheets.values.get({
      spreadsheetId,
      range: `${tabName}!A2:O`
    });

    const rows = response.data.values ?? [];
    const snapshots = rows
      .map((row) => parseRow(row))
      .filter((row) => Boolean(row.date))
      .sort((a, b) => a.date.localeCompare(b.date));

    return limit > 0 ? snapshots.slice(-limit) : snapshots;
  } catch (error) {
    console.error("Failed to read history snapshots", error);
    return [];
  }
}

export async function upsertHistorySnapshot(snapshot: HistorySnapshot): Promise<{ ok: boolean; error?: string }> {
  if (!isConfigured()) {
    return { ok: false, error: "Google Sheets is not configured" };
  }

  const spreadsheetId = getSheetId();
  const tabName = getTabName();
  const client = await getClient();
  if (!client || !spreadsheetId) {
    return { ok: false, error: "Unable to initialize Google Sheets client" };
  }

  try {
    await ensureHistoryTab(client, spreadsheetId, tabName);

    const current = await client.spreadsheets.values.get({
      spreadsheetId,
      range: `${tabName}!A2:O`
    });

    const rows = current.data.values ?? [];
    const existingIndex = rows.findIndex((row) => row[0] === snapshot.date);
    const rowValues = [toRow(snapshot)];

    if (existingIndex >= 0) {
      const existingSource = (rows[existingIndex]?.[14] ?? "").toString().trim().toLowerCase();
      const incomingSource = (snapshot.source ?? "auto").toLowerCase();
      if (existingSource === "manual" && incomingSource === "auto") {
        return { ok: true, error: "Skipped auto overwrite because manual row is locked for this date" };
      }

      const rowNumber = existingIndex + 2;
      await client.spreadsheets.values.update({
        spreadsheetId,
        range: `${tabName}!A${rowNumber}:O${rowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: rowValues }
      });
    } else {
      await client.spreadsheets.values.append({
        spreadsheetId,
        range: `${tabName}!A:O`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: rowValues }
      });
    }

    return { ok: true };
  } catch (error) {
    console.error("Failed to upsert history snapshot", error);
    return { ok: false, error: error instanceof Error ? error.message : "Unknown history write error" };
  }
}
