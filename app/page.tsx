import { BarTrend } from "@/components/charts/BarTrend";
import { LineTrend } from "@/components/charts/LineTrend";
import { StackedTrend } from "@/components/charts/StackedTrend";
import { KpiCard } from "@/components/KpiCard";
import { Leaderboard } from "@/components/Leaderboard";
import { SectionHeader } from "@/components/SectionHeader";
import { getDashboardData } from "@/lib/dashboard-service";
import { SeriesPoint } from "@/lib/types";

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function relabelWeeklySeries(points: SeriesPoint[], baseDate = new Date()): SeriesPoint[] {
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);
  return points.map((point, index, arr) => ({
    ...point,
    label: addDays(today, -7 * (arr.length - 1 - index)).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    })
  }));
}

function relabelMonthlySeries(points: SeriesPoint[], baseDate = new Date()): SeriesPoint[] {
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);
  return points.map((point, index, arr) => ({
    ...point,
    label: addMonths(today, -(arr.length - 1 - index)).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric"
    })
  }));
}

export default async function Page() {
  const data = await getDashboardData();
  const businessMarketShareTrend = relabelWeeklySeries(data.sections.business.marketShareTrend);
  const businessVolumeTrend = relabelWeeklySeries(data.sections.business.volumeTrend);
  const businessMonthlyVolumeTrend = relabelMonthlySeries(data.sections.business.volumeMonthlyTrend);
  const businessRevenueTrend = relabelWeeklySeries(data.sections.business.revenueTrend);
  const businessSegmentBreakdown = relabelWeeklySeries(data.sections.business.segmentBreakdown);
  const businessUserNewTrend = relabelWeeklySeries(data.sections.business.userNewTrend);
  const businessUserActiveTrend = relabelWeeklySeries(data.sections.business.userActiveTrend);
  const businessStakeUsersTrend = relabelWeeklySeries(data.sections.business.stakeUsersTrend);
  const businessStakedVsSupplyTrend = relabelWeeklySeries(data.sections.business.stakedVsSupplyTrend);
  const businessOmnivaultTrend = relabelWeeklySeries(data.sections.business.omnivaultTrend);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <header className="sticky top-0 z-10 mb-6 rounded-xl border border-slate-200 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink">Orderly KPI Dashboard</h1>
            <p className="text-sm text-muted">Single source of truth for executive KPI tracking</p>
          </div>
          <div className="flex gap-3 text-sm">
            <a className="text-accent hover:underline" href="#defi">DeFi</a>
            <a className="text-accent hover:underline" href="#token">Token</a>
            <a className="text-accent hover:underline" href="#business">Business</a>
            <a className="text-accent hover:underline" href="#ecosystem">Ecosystem</a>
            <a className="text-accent hover:underline" href="/admin">Admin</a>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">As of {new Date(data.asOf).toLocaleString()}</p>
      </header>

      <section id="defi" className="mb-8 scroll-mt-20">
        <SectionHeader
          title={data.sections.defi.title}
          description={data.sections.defi.description}
          lastUpdated={data.sections.defi.lastUpdated}
        />
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          {data.sections.defi.kpis.map((item) => (
            <KpiCard key={item.id} kpi={item} />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <BarTrend title="6-Week Weekly Perp Volume Trend ($B)" data={data.sections.defi.trend6w} />
          </div>
          <Leaderboard rows={data.sections.defi.leaderboard} />
          <div className="lg:col-span-3">
            <LineTrend title="Orderly 30D Rank Trend" data={data.sections.defi.rankTrend6w} invert />
          </div>
        </div>
      </section>

      <section id="token" className="mb-8 scroll-mt-20">
        <SectionHeader
          title={data.sections.token.title}
          description={data.sections.token.description}
          lastUpdated={data.sections.token.lastUpdated}
        />
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          {data.sections.token.kpis.map((item) => (
            <KpiCard key={item.id} kpi={item} />
          ))}
        </div>
        <LineTrend title="CMC Rank Trend (6 Weeks)" data={data.sections.token.rankTrend6w} invert />
      </section>

      <section id="business" className="mb-8 scroll-mt-20">
        <SectionHeader
          title={data.sections.business.title}
          description={data.sections.business.description}
          lastUpdated={data.sections.business.lastUpdated}
        />
        <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.sections.business.kpis.map((item) => (
            <KpiCard key={item.id} kpi={item} />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <LineTrend title="Market Share Trend (%)" data={businessMarketShareTrend} suffix="%" />
          <BarTrend title="Average Daily Volume in Weekly Timeframe ($M)" data={businessVolumeTrend} suffix="M" />
          <BarTrend title="Average Daily Volume in Monthly Timeframe ($M)" data={businessMonthlyVolumeTrend} suffix="M" />
          <BarTrend title="Revenue / Day ($K)" data={businessRevenueTrend} suffix="K" />
          <StackedTrend
            title="Trading Volume Segment Mix (%)"
            data={businessSegmentBreakdown}
            labels={["2B", "2C", "MM"]}
            yDomainMax={100}
          />
          <BarTrend title="New Users / Day" data={businessUserNewTrend} />
          <BarTrend title="Active Users / Day" data={businessUserActiveTrend} />
          <BarTrend title="$ORDER Stake Users" data={businessStakeUsersTrend} />
          <BarTrend title="Staked $ORDER vs Circulating Supply (%)" data={businessStakedVsSupplyTrend} suffix="%" />
          <div className="lg:col-span-2">
            <StackedTrend
              title="Omnivault TVL Composition ($M)"
              data={businessOmnivaultTrend}
              labels={["Kronos QLS", "Omnivault", "Smaug"]}
            />
          </div>
        </div>
      </section>

      <section id="ecosystem" className="scroll-mt-20">
        <SectionHeader
          title={data.sections.ecosystem.title}
          description={data.sections.ecosystem.description}
          lastUpdated={data.sections.ecosystem.lastUpdated}
        />
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          {data.sections.ecosystem.kpis.map((item) => (
            <KpiCard key={item.id} kpi={item} />
          ))}
        </div>
        <BarTrend title="Weekly New DEX Onboarding" data={data.sections.ecosystem.onboardingTrend} />
      </section>
    </main>
  );
}
