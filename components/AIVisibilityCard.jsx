'use client';

import { Sparkles, Info } from 'lucide-react';

/**
 * AIVisibilityCard — Painel de Visibilidade em IA (LLMs).
 *
 * O SEMrush lançou o recurso "AI Overview Tracking" e "Copilot" em 2024–2025.
 * A API pública para este recurso ainda é restrita (beta fechado).
 *
 * Este componente exibe as instruções para ativar assim que o acesso for liberado,
 * e já está estruturado para consumir o endpoint quando disponível.
 *
 * Para verificar disponibilidade: https://developer.semrush.com/api/
 */
export default function AIVisibilityCard({ data = null, loading = false }) {
  // Quando o endpoint estiver disponível, "data" terá a estrutura:
  // { visibility_score, mentions, top_queries: [], trend: [] }

  if (loading) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5 animate-pulse h-40">
        <div className="h-5 bg-surface-border rounded w-48 mb-3" />
        <div className="h-20 bg-surface-border rounded" />
      </div>
    );
  }

  return (
    <div className="bg-surface-card border border-purple-500/20 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-purple-400" />
        <h3 className="text-sm font-semibold text-slate-300">
          Visibilidade em IA (LLMs)
        </h3>
        <span className="ml-auto text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-2 py-0.5">
          BETA
        </span>
      </div>

      {data ? (
        // Quando dados estiverem disponíveis
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-slate-500 text-xs mb-1">Score de Visibilidade</p>
            <p className="text-2xl font-bold text-purple-400">{data.visibility_score ?? '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-1">Menções detectadas</p>
            <p className="text-2xl font-bold text-white">{data.mentions ?? '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-1">Queries rastreadas</p>
            <p className="text-2xl font-bold text-white">{data.top_queries?.length ?? '—'}</p>
          </div>
        </div>
      ) : (
        // Estado de espera pelo acesso à API
        <div className="flex gap-3 bg-purple-500/5 border border-purple-500/10 rounded-xl p-4">
          <Info size={15} className="text-purple-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400 space-y-1.5">
            <p>
              O SEMrush liberou o <strong className="text-slate-300">AI Overview Tracking</strong> (rastreamento de menções em respostas de ChatGPT, Gemini, Copilot e Perplexity) em 2025.
            </p>
            <p>
              O acesso via API ainda está em <strong className="text-purple-400">beta fechado</strong>. Quando liberado, este painel será populado automaticamente via o endpoint:
            </p>
            <code className="block bg-surface-border rounded px-2 py-1 text-slate-300 text-[11px] mt-1 font-mono">
              GET /api/semrush/ai-visibility?domain=...
            </code>
            <p>
              Para solicitar acesso: <a href="https://www.semrush.com/ai-overview/" target="_blank" rel="noopener noreferrer" className="text-brand-500 underline">semrush.com/ai-overview</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
