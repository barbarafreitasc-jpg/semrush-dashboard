'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatNumber, formatMonthYear } from '@/lib/utils';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-3 text-sm shadow-xl">
      <p className="text-slate-400 mb-2">{formatMonthYear(label)}</p>
      {payload.map(entry => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: {formatNumber(entry.value)}
        </p>
      ))}
    </div>
  );
};

export default function TrafficChart({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="h-64 bg-surface-card border border-surface-border rounded-2xl animate-pulse" />
    );
  }

  if (!data.length) {
    return (
      <div className="h-64 bg-surface-card border border-surface-border rounded-2xl flex items-center justify-center text-slate-500">
        Sem dados de histórico disponíveis
      </div>
    );
  }

  const formatted = data.map(d => ({
    ...d,
    monthLabel: formatMonthYear(d.date),
  }));

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">
        Tráfego Orgânico Estimado (12 meses)
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#4361ee" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4361ee" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="keywordsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
          <XAxis
            dataKey="monthLabel"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatNumber}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '12px' }}
          />
          <Area
            type="monotone"
            dataKey="traffic"
            name="Tráfego"
            stroke="#4361ee"
            strokeWidth={2}
            fill="url(#trafficGrad)"
            dot={false}
            activeDot={{ r: 5, fill: '#4361ee' }}
          />
          <Area
            type="monotone"
            dataKey="keywords"
            name="Keywords"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#keywordsGrad)"
            dot={false}
            activeDot={{ r: 5, fill: '#10b981' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
