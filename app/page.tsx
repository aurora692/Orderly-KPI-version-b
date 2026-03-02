import { BarTrend } from "@/components/charts/BarTrend";
import { LineTrend } from "@/components/charts/LineTrend";
import { StackedTrend } from "@/components/charts/StackedTrend";
import { KpiCard } from "@/components/KpiCard";
import { Leaderboard } from "@/components/Leaderboard";
import { SectionHeader } from "@/components/SectionHeader";
import { getDashboardData } from "@/lib/dashboard-service";

export default async function Page() {
  const data = await getDashboardData();

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
          <LineTrend title="Market Share Trend (%)" data={data.sections.business.marketShareTrend} suffix="%" />
          <BarTrend title="Average Daily Volume ($M)" data={data.sections.business.volumeTrend} suffix="M" />
          <BarTrend title="Revenue / Day ($K)" data={data.sections.business.revenueTrend} suffix="K" />
          <StackedTrend
            title="Trading Volume Segment Mix (%)"
            data={data.sections.business.segmentBreakdown}
            labels={["2B", "2C", "MM"]}
            yDomainMax={100}
          />
          <BarTrend title="New Users / Day" data={data.sections.business.userNewTrend} />
          <BarTrend title="Active Users / Day" data={data.sections.business.userActiveTrend} />
          <BarTrend title="$ORDER Stake Users" data={data.sections.business.stakeUsersTrend} />
          <BarTrend title="Staked $ORDER vs Circulating Supply (%)" data={data.sections.business.stakedVsSupplyTrend} suffix="%" />
          <div className="lg:col-span-2">
            <StackedTrend
              title="Omnivault TVL Composition ($M)"
              data={data.sections.business.omnivaultTrend}
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
