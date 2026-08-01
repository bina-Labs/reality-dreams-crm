"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  PieChart,
  Pie,
  Legend,
} from "recharts";

export type Datum = { name: string; value: number; color?: string };

const PIE_COLORS = ["#0d9488", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ec4899", "#22c55e", "#6b7280"];

export function StageBars({ data }: { data: Datum[] }) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" allowDecimals={false} hide />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tick={{ fontSize: 12, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--surface-2)" }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            fontSize: 13,
          }}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? "#0d9488"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MiniDonut({ data }: { data: Datum[] }) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={45}
          outerRadius={75}
          paddingAngle={2}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            fontSize: 13,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Donut for "by source" with the dominant share shown in the center. */
export function SourceDonut({ data }: { data: Datum[] }) {
  if (!data.length) return <Empty />;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const top = [...data].sort((a, b) => b.value - a.value)[0];
  const topPct = Math.round((top.value / total) * 100);
  return (
    <div className="flex items-center justify-between gap-4">
      <ul className="min-w-0 flex-1 space-y-2">
        {data.map((d, i) => (
          <li key={i} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: d.color ?? PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="truncate">{d.name}</span>
            </span>
            <span className="shrink-0 font-medium text-muted">
              {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
      <div className="relative h-28 w-28 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={54} paddingAngle={2} stroke="none">
              {data.map((d, i) => (
                <Cell key={i} fill={d.color ?? PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-extrabold text-primary">
          {topPct}%
        </div>
      </div>
    </div>
  );
}

/** Horizontal stacked proportion bar for "by language", with a legend. */
export function LanguageBar({ data }: { data: Datum[] }) {
  if (!data.length) return <Empty />;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-2">
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              width: `${(d.value / total) * 100}%`,
              background: d.color ?? PIE_COLORS[i % PIE_COLORS.length],
            }}
          />
        ))}
      </div>
      <ul className="space-y-1.5">
        {data.map((d, i) => (
          <li key={i} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: d.color ?? PIE_COLORS[i % PIE_COLORS.length] }}
              />
              {d.name}
            </span>
            <span className="font-semibold text-muted">
              {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-muted">—</div>
  );
}
