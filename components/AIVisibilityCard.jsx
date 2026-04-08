'use client';

import { Sparkles, Bot, TrendingUp, Star, ExternalLink } from 'lucide-react';

/**
 * AIVisibilityCard — Painel de Visibilidade em IA (Google AI Overviews).
 *
 * Exibe quais keywords do domínio aparecem em AI Overviews do Google,
 * calculadas a partir da coluna 'Ai' do endpoint domain_organic da SEMrush API.
 */
export default function AIVisibilityCard({ data = null, loading = false }) {
  if (loading) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5 animate-pulse">
        <div className="h-5 bg-surface-border rounded w-48 mb-4" />
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-surface-border rounded-xl" />
          ))}
        </div>
        <div className="h-32 bg-surface-border rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-surface-card border border-purple-500/20 rounded-2xl p-5 flex items-center justify-center min-h-[160px]">
        <div className="text-center text-slate-500 text-sm">
          <Sparkles size={20} className="mx-auto mb-2 text-purple-400/40" />
          Analise um domínio para ver os dados de IA
        </div>
      </div>
    );
  }

  const hasAIData = data.aiKeywords > 0;

  const scoreColor =
    data.visibilityScore >= 30 ? 'text-emerald-400' :
    data.visibilityScore >= 10 ? 'text-yellow-400' :
    'text-red-400';

  const scoreBg =
    data.visibilityScore >= 30 ? 'bg-emerald-500/10 border-emerald-500/20' :
    data.visibilityScore >= 10 ? 'bg-yellow-500/10 border-yellow-500/20' :
    'bg-red-500/10 border-red-500/20';

  return (
    <div className="bg-surface-card border border-purple-500/20 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={14} className="text-purple-400" />
        <h3 className="text-sm font-semibold text-slate-300">
          Visibilidade em IA (Google AI Overviews)
        </h3>
        <a
          href="https://pt.semrush.com/ai-seo/overview/"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-[10px] font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1"
        >
          Ver no SEMrush <ExternalLink size={9} />
        </a>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className={`rounded-xl p-3 border ${scoreBg}`}>
          <p className="text-[10px] text-slate-500 mb-1">Score de Visibilidade</p>
          <p className={`text-2xl font-bold ${scoreColor}`}>
            {data.visibilityScore}<span className="text-sm font-normal">%</span>
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5">das top keywords</p>
        </div>

        <div className="rounded-xl p-3 border border-surface-border bg-surface-border/30">
          <p className="text-[10px] text-slate-500 mb-1">Keywords em AI</p>
          <p className="text-2xl font-bold text-purple-400">{data.aiKeywords}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">de {data.totalKeywordsAnalyzed} analisadas</p>
        </div>

        <div className="rounded-xl p-3 border border-surface-border bg-surface-border/30">
          <p className="text-[10px] text-slate-500 mb-1">Featured Snippets</p>
          <p className="text-2xl font-bold text-cyan-400">{data.featuredSnippets}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">posições conquistadas</p>
        </div>
      </div>

      {/* Barra de tráfego via AI */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Bot size={9} />
            Tráfego estimado via AI Overviews
          </span>
          <span className="text-[10px] font-semibold text-purple-400">{data.aiTrafficPct}%</span>
        </div>
        <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(data.aiTrafficPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Lista de top keywords com AI */}
      {hasAIData ? (
        <div>
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">
            Top keywords com AI Overview
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
            {data.topAIKeywords.slice(0, 10).map((kw, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-surface-border/30 rounded-lg px-2.5 py-1.5 group"
              >
                <span className="text-[10px] text-slate-600 w-4 shrink-0">{idx + 1}</span>
                <span className="text-xs text-slate-300 flex-1 truncate font-medium">{kw.keyword}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-500 hidden sm:block">
                    vol {kw.volume.toLocaleString('pt-BR')}
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    kw.position <= 3
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : kw.position <= 10
                      ? 'bg-brand-500/15 text-brand-400'
                      : 'bg-slate-500/15 text-slate-400'
                  }`}>
                    #{kw.position}
                  </span>
                  <Star size={9} className="text-purple-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-surface-border/30 rounded-xl p-4 text-center">
          <Bot size={16} className="mx-auto mb-2 text-slate-600" />
          <p className="text-xs text-slate-500">
            Nenhuma keyword deste domínio foi detectada em AI Overviews do Google no período selecionado.
          </p>
          <p className="text-[10px] text-slate-600 mt-1">
            Isso pode indicar oportunidade de otimização para IA.
          </p>
        </div>
      )}
    </div>
  );
}
