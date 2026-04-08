'use client';

import { useState } from 'react';
import { formatNumber, formatCurrency, positionColor } from '@/lib/utils';
import { ChevronUp, ChevronDown, Minus, Search } from 'lucide-react';

function PositionBadge({ current, previous }) {
  const delta = previous - current;
  const colorClass = positionColor(current);

  return (
    <div className="flex items-center gap-1.5">
      <span className={`font-bold tabular-nums ${colorClass}`}>{current}</span>
      {delta > 0 && <span className="text-emerald-400 text-xs flex items-center"><ChevronUp size={12} />{delta}</span>}
      {delta < 0 && <span className="text-red-400 text-xs flex items-center"><ChevronDown size={12} />{Math.abs(delta)}</span>}
      {delta === 0 && <Minus size={10} className="text-slate-600" />}
    </div>
  );
}

function MiniSparkline({ trend }) {
  if (!trend) return null;
  const values = trend.split(',').map(Number);
  if (!values.length) return null;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const width = 60;
  const height = 20;
  const step = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const lastTwo = values.slice(-2);
  const isUp = lastTwo[1] >= lastTwo[0];

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? '#10b981' : '#ef4444'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function KeywordsTable({ keywords = [], loading = false }) {
  const [search, setSearch] = useState('');
  const [page,   setPage]   = useState(1);
  const perPage = 15;

  const filtered = keywords.filter(k =>
    (k?.keyword ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage);

  if (loading) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5 animate-pulse">
        <div className="h-6 bg-surface-border rounded w-48 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-surface-border rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-slate-300">
          Palavras-chave Orgânicas
          <span className="ml-2 text-slate-500 font-normal">({filtered.length})</span>
        </h3>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Filtrar keyword..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="bg-surface-border text-sm text-slate-300 placeholder-slate-600 rounded-lg pl-8 pr-3 py-1.5 border border-surface-border focus:border-brand-500 focus:outline-none w-48"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-surface-border">
              <th className="pb-2 font-medium">Keyword</th>
              <th className="pb-2 font-medium text-right">Pos.</th>
              <th className="pb-2 font-medium text-right">Volume</th>
              <th className="pb-2 font-medium text-right">CPC</th>
              <th className="pb-2 font-medium text-right hidden md:table-cell">Tráfego %</th>
              <th className="pb-2 font-medium text-right hidden lg:table-cell">Tend.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border/50">
            {paginated.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  Nenhuma keyword encontrada
                </td>
              </tr>
            )}
            {paginated.map((kw, i) => (
              <tr key={i} className="hover:bg-surface-border/30 transition-colors group">
                <td className="py-2.5 pr-4">
                  <div className="text-slate-200 font-medium truncate max-w-[200px]" title={kw.keyword}>
                    {kw.keyword}
                  </div>
                  {kw.url && (
                    <div className="text-slate-600 text-xs truncate max-w-[200px]" title={kw.url}>
                      {kw.url}
                    </div>
                  )}
                </td>
                <td className="py-2.5 text-right">
                  <PositionBadge current={kw.position} previous={kw.prevPosition} />
                </td>
                <td className="py-2.5 text-right text-slate-300 tabular-nums">
                  {formatNumber(kw.volume)}
                </td>
                <td className="py-2.5 text-right text-slate-400 tabular-nums">
                  {kw.cpc ? `$${Number(kw.cpc).toFixed(2)}` : '—'}
                </td>
                <td className="py-2.5 text-right text-slate-400 tabular-nums hidden md:table-cell">
                  {kw.trafficShare ? `${Number(kw.trafficShare).toFixed(1)}%` : '—'}
                </td>
                <td className="py-2.5 text-right hidden lg:table-cell">
                  <MiniSparkline trend={kw.trend} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-border">
          <span className="text-xs text-slate-500">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs px-3 py-1 rounded-lg bg-surface-border text-slate-300 disabled:opacity-40 hover:bg-brand-500/20 transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-xs px-3 py-1 rounded-lg bg-surface-border text-slate-300 disabled:opacity-40 hover:bg-brand-500/20 transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
