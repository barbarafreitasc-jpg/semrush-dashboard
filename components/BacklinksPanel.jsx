'use client';

import { formatNumber, ascolorClass } from '@/lib/utils';
import { Link2, Shield, TrendingUp, Globe } from 'lucide-react';

function StatBox({ label, value, color = 'text-slate-200' }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-slate-500 text-xs">{label}</span>
      <span className={`font-bold text-lg tabular-nums ${color}`}>{formatNumber(value)}</span>
    </div>
  );
}

export default function BacklinksPanel({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5 animate-pulse">
        <div className="h-5 bg-surface-border rounded w-32 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-surface-border rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.overview) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5 flex items-center justify-center text-slate-500 h-40">
        Sem dados de backlinks disponíveis
      </div>
    );
  }

  const { overview, newLinks = [] } = data;

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Backlinks</h3>
        <div className="flex items-center gap-1.5 bg-brand-500/10 border border-brand-500/20 rounded-full px-3 py-1">
          <Shield size={12} className="text-brand-500" />
          <span className={`text-sm font-bold ${ascolorClass(overview.authorityScore)}`}>
            AS {overview.authorityScore}
          </span>
          <span className="text-slate-500 text-xs">Authority Score</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Total de Backlinks"  value={overview.total}            color="text-white" />
        <StatBox label="Domínios Ref."       value={overview.referringDomains} color="text-brand-500" />
        <StatBox label="Dofollow"            value={overview.dofollow}         color="text-emerald-400" />
        <StatBox label="Nofollow"            value={overview.nofollow}         color="text-slate-400" />
        <StatBox label="URLs referenciadas"  value={overview.referringUrls}    />
        <StatBox label="IPs referenciadores" value={overview.referringIPs}     />
        <StatBox label="Links de texto"      value={overview.textLinks}        />
        <StatBox label="Links de imagem"     value={overview.imageLinks}       />
      </div>

      {newLinks.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <TrendingUp size={12} className="text-emerald-400" />
            Backlinks recentes
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {newLinks.slice(0, 10).map((link, i) => (
              <div key={i} className="flex items-start gap-2 text-xs bg-surface-border/40 rounded-lg px-3 py-2 hover:bg-surface-border/70 transition-colors">
                <Globe size={11} className="text-slate-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <a
                    href={link.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-500 hover:underline truncate block"
                    title={link.sourceUrl}
                  >
                    {link.sourceUrl}
                  </a>
                  {link.anchor && (
                    <span className="text-slate-500">âncora: "{link.anchor}"</span>
                  )}
                </div>
                {link.nofollow && (
                  <span className="shrink-0 text-slate-600 border border-slate-700 rounded px-1 text-[10px]">
                    nofollow
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
