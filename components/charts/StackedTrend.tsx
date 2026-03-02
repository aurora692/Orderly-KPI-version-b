"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SeriesPoint } from "@/lib/types";

export function StackedTrend({
  title,
  data,
  labels = ["A", "B", "C"],
  yDomainMax
}: {
  title: string;
  data: SeriesPoint[];
  labels?: [string, string, string];
  yDomainMax?: number;
}) {
  return (
    <section className="rounded-xl bg-card p-4 shadow-panel">
      <h3 className="mb-2 text-sm font-semibold text-ink">{title}</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" fontSize={12} stroke="#64748b" />
            <YAxis fontSize={12} stroke="#64748b" domain={yDomainMax ? [0, yDomainMax] : undefined} />
            <Tooltip />
            <Bar name={labels[0]} dataKey="value" stackId="a" fill="#0f766e" radius={[4, 4, 0, 0]} />
            <Bar name={labels[1]} dataKey="valueB" stackId="a" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            <Bar name={labels[2]} dataKey="valueC" stackId="a" fill="#99f6e4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
