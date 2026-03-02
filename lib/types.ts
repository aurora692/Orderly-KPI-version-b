export type DeltaDirection = "up" | "down" | "flat";

export type Delta = {
  value: string;
  direction: DeltaDirection;
  label?: string;
};

export type Kpi = {
  id: string;
  label: string;
  value: string;
  delta?: Delta;
  source: "auto" | "manual";
};

export type SeriesPoint = {
  label: string;
  value: number;
  valueB?: number;
  valueC?: number;
};

export type LeaderboardRow = {
  name: string;
  volume: string;
};

export type DashboardSection = {
  id: string;
  title: string;
  description: string;
  lastUpdated: string;
  kpis: Kpi[];
};

export type DashboardData = {
  asOf: string;
  sections: {
    defi: DashboardSection & {
      trend6w: SeriesPoint[];
      leaderboard: LeaderboardRow[];
      rankTrend6w: SeriesPoint[];
    };
    token: DashboardSection & {
      rankTrend6w: SeriesPoint[];
    };
    business: DashboardSection & {
      marketShareTrend: SeriesPoint[];
      volumeTrend: SeriesPoint[];
      revenueTrend: SeriesPoint[];
      userNewTrend: SeriesPoint[];
      userActiveTrend: SeriesPoint[];
      stakeUsersTrend: SeriesPoint[];
      stakedVsSupplyTrend: SeriesPoint[];
      omnivaultTrend: SeriesPoint[];
      segmentBreakdown: SeriesPoint[];
    };
    ecosystem: DashboardSection & {
      onboardingTrend: SeriesPoint[];
    };
  };
};

export type AdminEntryInput = {
  date: string;
  total_perp_volume_7d: number;
  orderly_rank_30d: number;
  orderly_volume_30d: number;
  top3_name_1: string;
  top3_vol_1: number;
  top3_name_2: string;
  top3_vol_2: number;
  top3_name_3: string;
  top3_vol_3: number;
  order_price: number;
  order_cmc_rank: number;
  total_dexs: number;
  graduated_dexs: number;
  market_share_current?: number;
  market_share_delta?: number;
  market_share_trend?: number[];
  avg_daily_volume_current_m?: number;
  avg_daily_volume_delta_pct?: number;
  avg_daily_volume_trend?: number[];
  revenue_day_current_k?: number;
  revenue_day_delta_pct?: number;
  revenue_day_trend?: number[];
  new_users_current?: number;
  new_users_delta_pct?: number;
  new_users_trend?: number[];
  active_users_current?: number;
  active_users_delta_pct?: number;
  active_users_trend?: number[];
  stake_users_current?: number;
  stake_users_delta_pct?: number;
  stake_users_trend?: number[];
  staked_vs_supply_current_pct?: number;
  staked_vs_supply_delta_pct?: number;
  staked_vs_supply_trend?: number[];
  omnivault_tvl_current_m?: number;
  omnivault_tvl_delta_pct?: number;
  omnivault_tvl_trend?: number[];
  volume_segments_1k_pct?: number;
  volume_segments_3c_pct?: number;
  volume_segments_mm_pct?: number;
  volume_segments_2b_trend?: number[];
  volume_segments_2c_trend?: number[];
  volume_segments_mm_trend?: number[];
  omnivault_vault_a_trend?: number[];
  omnivault_vault_b_trend?: number[];
  omnivault_vault_c_trend?: number[];
  source: "auto" | "manual";
};
