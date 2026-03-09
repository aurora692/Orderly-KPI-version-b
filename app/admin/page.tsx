"use client";

import { useMemo, useState } from "react";

type FormState = {
  date: string;
  total_perp_volume_7d: string;
  orderly_rank_30d: string;
  orderly_volume_30d: string;
  top3_name_1: string;
  top3_vol_1: string;
  top3_name_2: string;
  top3_vol_2: string;
  top3_name_3: string;
  top3_vol_3: string;
  order_price: string;
  order_cmc_rank: string;
  total_dexs: string;
  graduated_dexs: string;
  weekly_new_dex_onboarding: string;
  market_share_current: string;
  market_share_delta: string;
  market_share_trend: string;
  avg_daily_volume_current_m: string;
  avg_daily_volume_delta_pct: string;
  avg_daily_volume_trend: string;
  avg_daily_volume_monthly_trend: string;
  revenue_day_current_k: string;
  revenue_day_delta_pct: string;
  revenue_day_trend: string;
  new_users_current: string;
  new_users_delta_pct: string;
  new_users_trend: string;
  active_users_current: string;
  active_users_delta_pct: string;
  active_users_trend: string;
  stake_users_current: string;
  stake_users_delta_pct: string;
  stake_users_trend: string;
  staked_vs_supply_current_pct: string;
  staked_vs_supply_delta_pct: string;
  staked_vs_supply_trend: string;
  omnivault_tvl_current_m: string;
  omnivault_tvl_delta_pct: string;
  omnivault_tvl_trend: string;
  volume_segments_1k_pct: string;
  volume_segments_3c_pct: string;
  volume_segments_mm_pct: string;
  volume_segments_2b_trend: string;
  volume_segments_2c_trend: string;
  volume_segments_mm_trend: string;
  omnivault_vault_a_trend: string;
  omnivault_vault_b_trend: string;
  omnivault_vault_c_trend: string;
  source: "auto" | "manual";
};

const initialState: FormState = {
  date: new Date().toISOString().slice(0, 10),
  total_perp_volume_7d: "301000000000",
  orderly_rank_30d: "39",
  orderly_volume_30d: "550050000",
  top3_name_1: "Hyperliquid",
  top3_vol_1: "204500000000",
  top3_name_2: "Astar",
  top3_vol_2: "141800000000",
  top3_name_3: "Lighter",
  top3_vol_3: "112900000000",
  order_price: "0.187",
  order_cmc_rank: "650",
  total_dexs: "2170",
  graduated_dexs: "146",
  weekly_new_dex_onboarding: "26",
  market_share_current: "0.22",
  market_share_delta: "0.03",
  market_share_trend: "0.12,0.14,0.16,0.19,0.20,0.21,0.19,0.22",
  avg_daily_volume_current_m: "62.8",
  avg_daily_volume_delta_pct: "-2.5",
  avg_daily_volume_trend: "55.1,58.4,61.2,63.8,64.5,67.1,64.4,62.8",
  avg_daily_volume_monthly_trend: "41.2,44.8,46.1,48.9,51.4,53.3,56.2,58.0,60.7,61.9,63.5,62.8",
  revenue_day_current_k: "3.8",
  revenue_day_delta_pct: "-18.7",
  revenue_day_trend: "3.1,3.4,3.6,3.9,4.3,4.1,4.7,3.8",
  new_users_current: "2104",
  new_users_delta_pct: "-21.1",
  new_users_trend: "1690,1733,1880,1902,2104,2311,2666,2104",
  active_users_current: "859",
  active_users_delta_pct: "2.4",
  active_users_trend: "715,731,778,799,808,847,839,859",
  stake_users_current: "4305",
  stake_users_delta_pct: "0.7",
  stake_users_trend: "3990,4050,4112,4177,4233,4267,4276,4305",
  staked_vs_supply_current_pct: "24.21",
  staked_vs_supply_delta_pct: "-0.17",
  staked_vs_supply_trend: "22.9,23.1,23.4,23.7,24.0,24.28,24.38,24.21",
  omnivault_tvl_current_m: "10.9",
  omnivault_tvl_delta_pct: "-2.0",
  omnivault_tvl_trend: "9.1,9.6,10.2,10.7,11.3,11.7,11.1,10.9",
  volume_segments_1k_pct: "17",
  volume_segments_3c_pct: "38",
  volume_segments_mm_pct: "45",
  volume_segments_2b_trend: "18,19,17,16,17,17",
  volume_segments_2c_trend: "36,37,39,40,39,38",
  volume_segments_mm_trend: "46,44,44,44,44,45",
  omnivault_vault_a_trend: "7.2,7.5,7.9,8.2,8.6,8.9,9.3,8.7",
  omnivault_vault_b_trend: "1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.4",
  omnivault_vault_c_trend: "0.8,0.9,1.0,1.1,1.2,1.2,1.4,0.8",
  source: "manual"
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const fields = useMemo(
    () => [
      ["date", "Date", "date"],
      ["total_perp_volume_7d", "Total Perp Volume 7D", "number"],
      ["orderly_rank_30d", "Orderly Rank 30D", "number"],
      ["orderly_volume_30d", "Orderly Volume 30D", "number"],
      ["top3_name_1", "Top 1 Name", "text"],
      ["top3_vol_1", "Top 1 Volume", "number"],
      ["top3_name_2", "Top 2 Name", "text"],
      ["top3_vol_2", "Top 2 Volume", "number"],
      ["top3_name_3", "Top 3 Name", "text"],
      ["top3_vol_3", "Top 3 Volume", "number"],
      ["order_price", "ORDER Price", "number"],
      ["order_cmc_rank", "CMC Rank", "number"],
      ["total_dexs", "Total DEXs", "number"],
      ["graduated_dexs", "Graduated DEXs", "number"],
      ["weekly_new_dex_onboarding", "Weekly New DEX Onboarding", "number"],
      ["market_share_current", "Market Share Current (%)", "number"],
      ["market_share_delta", "Market Share WoW Delta (%)", "number"],
      ["market_share_trend", "Market Share Trend (%) CSV", "text"],
      ["avg_daily_volume_current_m", "Avg Daily Volume Current (M)", "number"],
      ["avg_daily_volume_delta_pct", "Avg Daily Volume Delta (%)", "number"],
      ["avg_daily_volume_trend", "Avg Daily Volume Trend CSV", "text"],
      ["avg_daily_volume_monthly_trend", "Avg Daily Volume Monthly Trend CSV (12)", "text"],
      ["revenue_day_current_k", "Revenue/Day Current (K)", "number"],
      ["revenue_day_delta_pct", "Revenue/Day Delta (%)", "number"],
      ["revenue_day_trend", "Revenue/Day Trend CSV", "text"],
      ["new_users_current", "New Users Current", "number"],
      ["new_users_delta_pct", "New Users Delta (%)", "number"],
      ["new_users_trend", "New Users Trend CSV", "text"],
      ["active_users_current", "Active Users Current", "number"],
      ["active_users_delta_pct", "Active Users Delta (%)", "number"],
      ["active_users_trend", "Active Users Trend CSV", "text"],
      ["stake_users_current", "Stake Users Current", "number"],
      ["stake_users_delta_pct", "Stake Users Delta (%)", "number"],
      ["stake_users_trend", "Stake Users Trend CSV", "text"],
      ["staked_vs_supply_current_pct", "Staked/Circ Current (%)", "number"],
      ["staked_vs_supply_delta_pct", "Staked/Circ Delta (%)", "number"],
      ["staked_vs_supply_trend", "Staked/Circ Trend CSV", "text"],
      ["omnivault_tvl_current_m", "Omnivault TVL Current (M)", "number"],
      ["omnivault_tvl_delta_pct", "Omnivault TVL Delta (%)", "number"],
      ["omnivault_tvl_trend", "Omnivault TVL Trend CSV", "text"],
      ["volume_segments_2b_trend", "Volume Segments 2B Trend CSV", "text"],
      ["volume_segments_2c_trend", "Volume Segments 2C Trend CSV", "text"],
      ["volume_segments_mm_trend", "Volume Segments MM Trend CSV", "text"],
      ["omnivault_vault_a_trend", "Omnivault Kronos QLS Trend CSV", "text"],
      ["omnivault_vault_b_trend", "Omnivault Trend CSV", "text"],
      ["omnivault_vault_c_trend", "Smaug Trend CSV", "text"]
    ] as const,
    []
  );

  async function scrapeNow() {
    setStatus("Running scrape...");
    const res = await fetch("/api/admin/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password
      }
    });
    const json = await res.json();
    if (!res.ok) {
      setStatus(`Scrape failed: ${json.error ?? "Unknown error"}`);
      return;
    }

    setForm((prev) => ({ ...prev, ...json.prefill }));
    setStatus("Scrape complete. Form pre-filled with latest data.");
  }

  async function submit() {
    setSubmitting(true);
    setStatus("Submitting...");

    const parseOptionalNumber = (value: string): number | undefined => {
      const normalized = value.trim();
      if (!normalized) return undefined;
      const numeric = Number(normalized);
      return Number.isNaN(numeric) ? undefined : numeric;
    };

    const parseCsvNumbers = (value: string): number[] | undefined => {
      const parsed = value
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((item) => !Number.isNaN(item));
      return parsed.length > 0 ? parsed : undefined;
    };

    const payload = {
      ...form,
      total_perp_volume_7d: Number(form.total_perp_volume_7d),
      orderly_rank_30d: Number(form.orderly_rank_30d),
      orderly_volume_30d: Number(form.orderly_volume_30d),
      top3_vol_1: Number(form.top3_vol_1),
      top3_vol_2: Number(form.top3_vol_2),
      top3_vol_3: Number(form.top3_vol_3),
      order_price: Number(form.order_price),
      order_cmc_rank: Number(form.order_cmc_rank),
      total_dexs: Number(form.total_dexs),
      graduated_dexs: Number(form.graduated_dexs),
      weekly_new_dex_onboarding: parseOptionalNumber(form.weekly_new_dex_onboarding),
      market_share_current: parseOptionalNumber(form.market_share_current),
      market_share_delta: parseOptionalNumber(form.market_share_delta),
      market_share_trend: parseCsvNumbers(form.market_share_trend),
      avg_daily_volume_current_m: parseOptionalNumber(form.avg_daily_volume_current_m),
      avg_daily_volume_delta_pct: parseOptionalNumber(form.avg_daily_volume_delta_pct),
      avg_daily_volume_trend: parseCsvNumbers(form.avg_daily_volume_trend),
      avg_daily_volume_monthly_trend: parseCsvNumbers(form.avg_daily_volume_monthly_trend),
      revenue_day_current_k: parseOptionalNumber(form.revenue_day_current_k),
      revenue_day_delta_pct: parseOptionalNumber(form.revenue_day_delta_pct),
      revenue_day_trend: parseCsvNumbers(form.revenue_day_trend),
      new_users_current: parseOptionalNumber(form.new_users_current),
      new_users_delta_pct: parseOptionalNumber(form.new_users_delta_pct),
      new_users_trend: parseCsvNumbers(form.new_users_trend),
      active_users_current: parseOptionalNumber(form.active_users_current),
      active_users_delta_pct: parseOptionalNumber(form.active_users_delta_pct),
      active_users_trend: parseCsvNumbers(form.active_users_trend),
      stake_users_current: parseOptionalNumber(form.stake_users_current),
      stake_users_delta_pct: parseOptionalNumber(form.stake_users_delta_pct),
      stake_users_trend: parseCsvNumbers(form.stake_users_trend),
      staked_vs_supply_current_pct: parseOptionalNumber(form.staked_vs_supply_current_pct),
      staked_vs_supply_delta_pct: parseOptionalNumber(form.staked_vs_supply_delta_pct),
      staked_vs_supply_trend: parseCsvNumbers(form.staked_vs_supply_trend),
      omnivault_tvl_current_m: parseOptionalNumber(form.omnivault_tvl_current_m),
      omnivault_tvl_delta_pct: parseOptionalNumber(form.omnivault_tvl_delta_pct),
      omnivault_tvl_trend: parseCsvNumbers(form.omnivault_tvl_trend),
      volume_segments_2b_trend: parseCsvNumbers(form.volume_segments_2b_trend),
      volume_segments_2c_trend: parseCsvNumbers(form.volume_segments_2c_trend),
      volume_segments_mm_trend: parseCsvNumbers(form.volume_segments_mm_trend),
      omnivault_vault_a_trend: parseCsvNumbers(form.omnivault_vault_a_trend),
      omnivault_vault_b_trend: parseCsvNumbers(form.omnivault_vault_b_trend),
      omnivault_vault_c_trend: parseCsvNumbers(form.omnivault_vault_c_trend)
    };

    const res = await fetch("/api/admin/entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setStatus(`Submit failed: ${json.error ?? "Unknown error"}`);
      return;
    }

    setStatus("Entry saved and dashboard cache invalidated.");
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold text-ink">Admin Panel</h1>
      <p className="mt-1 text-sm text-muted">Manual fallback entry for dashboard KPIs and scrape retry.</p>

      <div className="mt-6 rounded-xl bg-card p-4 shadow-panel">
        <label className="mb-1 block text-sm text-muted">Admin Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Enter ADMIN_PASSWORD"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={scrapeNow}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Scrape Now
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save Entry"}
        </button>
      </div>

      <p className="mt-3 text-sm text-muted">{status}</p>
      <p className="mt-1 text-xs text-muted">
        CSV format example (6 weeks): <code>55.1,58.4,61.2,63.8,64.5,67.1</code>
      </p>

      <section className="mt-6 grid gap-3 rounded-xl bg-card p-4 shadow-panel md:grid-cols-2">
        {fields.map(([key, label, type]) => (
          <label key={key} className="block text-sm">
            <span className="mb-1 block text-muted">{label}</span>
            <input
              type={type}
              value={form[key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        ))}

        <label className="block text-sm">
          <span className="mb-1 block text-muted">Source</span>
          <select
            value={form.source}
            onChange={(e) => setForm((prev) => ({ ...prev, source: e.target.value as "auto" | "manual" }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="manual">manual</option>
            <option value="auto">auto</option>
          </select>
        </label>
      </section>
    </main>
  );
}
