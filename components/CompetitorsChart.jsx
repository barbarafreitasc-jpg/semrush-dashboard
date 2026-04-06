'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatNumber } from '@/lib/utils';

const COLORS = ['#4361ee', '#7c3aed', '#0891b2', '#0d9488', '#d97706', '#dc2626', '#ea580c', '#16a34a', '#db2777', '#6366f1'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-3 text-sm shadow-xl">
      <p className="text-white font-semibold mb-2">{label}</p>
      {payload.map(entry => (
        <div key={entry.dataKey} className="flex justify-between gap-6">
          <span className="text-slate-400">{entry.name}</span>
          <span style={{ color: entry.fill }} className="font-semibold tabular-nums">
            {formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function CompetitorsChart({ competitors = [], targetDomain = '', loading = false }) {
  if (loading) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5 animate-pulse h-72">
        <div className="h-5 bg-surface-border rounded w-48 mb-4" />
        <div className="h-full bg-surface-border rounded" />
      </div>
    );
  }

  if (!competitors.length) {
    return (
      <div className="h-72 bg-surface-card border border-surface-border rounded-2xl flex items-center justify-center text-slate-500">
        Sem dados de concorrentes disponíveis
      </div>
    );
  }

  const data = competitors.slice(0, 9).map(c => ({
    domain:         c.domain,
    'Keywords comuns': c.commonKeywords,
    'Tráfego orgânico': c.organicTraffic,
  }));

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">
        Concorrentes Orgânicos (Share of Visibility)
      </h3>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatNumber}
          />
          <YAxis
            type="category"
            dataKey="domain"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Tráfego orgânico" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 pt-3 border-t border-surface-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500">
              <th className="text-left pb-1 font-medium">Concorrente</th>
              <th className="text-right pb-1 font-medium">Keywords comuns</th>
              <th className="text-right pb-1 font-medium">Keywords totais</th>
              <th className="text-right pb-1 font-medium">Tráfego est.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border/40">
            {competitors.slice(0, 8).map((c, i) => (
              <tr key={i} className="hover:bg-surface-border/20">
                <td className="py-1.5 text-slate-300 font-medium">{c.domain}</td>
                <td className="py-1.5 text-right text-slate-400 tabular-nums">{formatNumber(c.commonKeywords)}</td>
                <td className="py-1.5 text-right text-slate-400 tabular-nums">{formatNumber(c.organicKeywords)}</td>
                <td className="py-1.5 text-right text-slate-400 tabular-nums">{formatNumber(c.organicTraffic)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
