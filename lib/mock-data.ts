import { DashboardData } from "@/lib/types";

export const mockDashboardData: DashboardData = {
  asOf: "2026-02-25T09:00:00.000Z",
  sections: {
    defi: {
      id: "defi",
      title: "Public DeFi Metrics",
      description: "Market-wide perp activity and Orderly competitive position.",
      lastUpdated: "2026-02-25T08:50:00.000Z",
      kpis: [
        {
          id: "weekly-perp-volume",
          label: "Weekly Perp Volume",
          value: "$301.0B",
          delta: { value: "+24.0%", direction: "up", label: "WoW" },
          source: "auto"
        },
        {
          id: "orderly-rank",
          label: "Orderly Rank (30D)",
          value: "#39",
          delta: { value: "+1", direction: "up", label: "WoW" },
          source: "auto"
        }
      ],
      trend6w: [
        { label: "W-5", value: 262 },
        { label: "W-4", value: 246 },
        { label: "W-3", value: 271 },
        { label: "W-2", value: 284 },
        { label: "W-1", value: 242 },
        { label: "Now", value: 301 }
      ],
      leaderboard: [
        { name: "Hyperliquid", volume: "$204.5B" },
        { name: "Astar", volume: "$141.8B" },
        { name: "Lighter", volume: "$112.9B" }
      ],
      rankTrend6w: [
        { label: "W-5", value: 44 },
        { label: "W-4", value: 43 },
        { label: "W-3", value: 42 },
        { label: "W-2", value: 41 },
        { label: "W-1", value: 40 },
        { label: "Now", value: 39 }
      ]
    },
    token: {
      id: "token",
      title: "$ORDER Token Market Data",
      description: "Price and ranking from CoinMarketCap.",
      lastUpdated: "2026-02-25T08:55:00.000Z",
      kpis: [
        {
          id: "order-price",
          label: "$ORDER Price",
          value: "$0.187",
          delta: { value: "-2.1%", direction: "down", label: "WoW" },
          source: "auto"
        },
        {
          id: "cmc-rank",
          label: "CMC Rank",
          value: "#650",
          delta: { value: "+19", direction: "up", label: "WoW" },
          source: "auto"
        }
      ],
      rankTrend6w: [
        { label: "W-5", value: 709 },
        { label: "W-4", value: 697 },
        { label: "W-3", value: 689 },
        { label: "W-2", value: 678 },
        { label: "W-1", value: 669 },
        { label: "Now", value: 650 }
      ]
    },
    business: {
      id: "business",
      title: "Internal Business Metrics",
      description: "Volume, revenue, users, staking, and TVL from Metabase.",
      lastUpdated: "2026-02-25T08:35:00.000Z",
      kpis: [
        {
          id: "market-share",
          label: "Market Share",
          value: "0.22%",
          delta: { value: "+0.03%", direction: "up", label: "WoW" },
          source: "auto"
        },
        {
          id: "avg-daily-volume",
          label: "Avg Daily Volume",
          value: "$62.8M",
          delta: { value: "-2.5%", direction: "down", label: "WoW" },
          source: "auto"
        },
        {
          id: "revenue-day",
          label: "Revenue / Day",
          value: "$3.8K",
          delta: { value: "-18.7%", direction: "down", label: "WoW" },
          source: "auto"
        },
        {
          id: "new-users",
          label: "New Users / Day",
          value: "2,104",
          delta: { value: "-21.1%", direction: "down", label: "WoW" },
          source: "auto"
        },
        {
          id: "active-users",
          label: "Active Users / Day",
          value: "859",
          delta: { value: "+2.4%", direction: "up", label: "WoW" },
          source: "auto"
        },
        {
          id: "stake-users",
          label: "$ORDER Stake Users",
          value: "4,305",
          delta: { value: "+0.7%", direction: "up", label: "WoW" },
          source: "auto"
        },
        {
          id: "staked-vs-supply",
          label: "Staked / Circulating",
          value: "24.21%",
          delta: { value: "-0.17%", direction: "down", label: "WoW" },
          source: "auto"
        },
        {
          id: "omnivault-tvl",
          label: "Omnivault TVL",
          value: "$10.9M",
          delta: { value: "-2.0%", direction: "down", label: "WoW" },
          source: "auto"
        }
      ],
      marketShareTrend: [
        { label: "W-7", value: 0.12 },
        { label: "W-6", value: 0.14 },
        { label: "W-5", value: 0.16 },
        { label: "W-4", value: 0.19 },
        { label: "W-3", value: 0.2 },
        { label: "W-2", value: 0.21 },
        { label: "W-1", value: 0.19 },
        { label: "Now", value: 0.22 }
      ],
      volumeTrend: [
        { label: "W-7", value: 55.1 },
        { label: "W-6", value: 58.4 },
        { label: "W-5", value: 61.2 },
        { label: "W-4", value: 63.8 },
        { label: "W-3", value: 64.5 },
        { label: "W-2", value: 67.1 },
        { label: "W-1", value: 64.4 },
        { label: "Now", value: 62.8 }
      ],
      volumeMonthlyTrend: [
        { label: "M-11", value: 41.2 },
        { label: "M-10", value: 44.8 },
        { label: "M-9", value: 46.1 },
        { label: "M-8", value: 48.9 },
        { label: "M-7", value: 51.4 },
        { label: "M-6", value: 53.3 },
        { label: "M-5", value: 56.2 },
        { label: "M-4", value: 58.0 },
        { label: "M-3", value: 60.7 },
        { label: "M-2", value: 61.9 },
        { label: "M-1", value: 63.5 },
        { label: "Now", value: 62.8 }
      ],
      revenueTrend: [
        { label: "W-7", value: 3.1 },
        { label: "W-6", value: 3.4 },
        { label: "W-5", value: 3.6 },
        { label: "W-4", value: 3.9 },
        { label: "W-3", value: 4.3 },
        { label: "W-2", value: 4.1 },
        { label: "W-1", value: 4.7 },
        { label: "Now", value: 3.8 }
      ],
      userNewTrend: [
        { label: "W-7", value: 1690 },
        { label: "W-6", value: 1733 },
        { label: "W-5", value: 1880 },
        { label: "W-4", value: 1902 },
        { label: "W-3", value: 2104 },
        { label: "W-2", value: 2311 },
        { label: "W-1", value: 2666 },
        { label: "Now", value: 2104 }
      ],
      userActiveTrend: [
        { label: "W-7", value: 715 },
        { label: "W-6", value: 731 },
        { label: "W-5", value: 778 },
        { label: "W-4", value: 799 },
        { label: "W-3", value: 808 },
        { label: "W-2", value: 847 },
        { label: "W-1", value: 839 },
        { label: "Now", value: 859 }
      ],
      stakeUsersTrend: [
        { label: "W-7", value: 3990 },
        { label: "W-6", value: 4050 },
        { label: "W-5", value: 4112 },
        { label: "W-4", value: 4177 },
        { label: "W-3", value: 4233 },
        { label: "W-2", value: 4267 },
        { label: "W-1", value: 4276 },
        { label: "Now", value: 4305 }
      ],
      stakedVsSupplyTrend: [
        { label: "W-7", value: 22.9 },
        { label: "W-6", value: 23.1 },
        { label: "W-5", value: 23.4 },
        { label: "W-4", value: 23.7 },
        { label: "W-3", value: 24.0 },
        { label: "W-2", value: 24.28 },
        { label: "W-1", value: 24.38 },
        { label: "Now", value: 24.21 }
      ],
      omnivaultTrend: [
        { label: "W-7", value: 7.2, valueB: 1.1, valueC: 0.8 },
        { label: "W-6", value: 7.5, valueB: 1.2, valueC: 0.9 },
        { label: "W-5", value: 7.9, valueB: 1.3, valueC: 1.0 },
        { label: "W-4", value: 8.2, valueB: 1.4, valueC: 1.1 },
        { label: "W-3", value: 8.6, valueB: 1.5, valueC: 1.2 },
        { label: "W-2", value: 8.9, valueB: 1.6, valueC: 1.2 },
        { label: "W-1", value: 9.3, valueB: 1.7, valueC: 1.4 },
        { label: "Now", value: 8.7, valueB: 1.4, valueC: 0.8 }
      ],
      segmentBreakdown: [
        { label: "Now", value: 17, valueB: 38, valueC: 45 }
      ]
    },
    ecosystem: {
      id: "ecosystem",
      title: "Orderly One Ecosystem",
      description: "DEX board coverage and graduation trend.",
      lastUpdated: "2026-02-25T08:40:00.000Z",
      kpis: [
        {
          id: "total-dexs",
          label: "Total DEXs",
          value: "2,170",
          delta: { value: "+26", direction: "up", label: "WoW" },
          source: "auto"
        },
        {
          id: "graduated-dexs",
          label: "Graduated DEXs",
          value: "146",
          delta: { value: "+4", direction: "up", label: "WoW" },
          source: "auto"
        }
      ],
      onboardingTrend: [
        { label: "W-7", value: 14 },
        { label: "W-6", value: 18 },
        { label: "W-5", value: 12 },
        { label: "W-4", value: 16 },
        { label: "W-3", value: 20 },
        { label: "W-2", value: 9 },
        { label: "W-1", value: 11 },
        { label: "Now", value: 26 }
      ]
    }
  }
};
