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

function Empty() {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-muted">—</div>
  );
}
