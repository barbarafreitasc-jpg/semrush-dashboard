'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Bot, Star, ExternalLink, Edit3, Save, X, RefreshCw, Info } from 'lucide-react';

const LS_KEY = 'semrush_ai_data';

function loadManual() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { return null; }
}
function saveManual(data) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

/**
 * AIVisibilityCard — Visibilidade em IA (LLM + Google SERP Features).
 *
 * Dados de LLM (Menções, Citações) vêm da página SEMrush AI SEO e são inseridos
 * manualmente pelo usuário. Dados de SERP Features vêm da API padrão.
 */
export default function AIVisibilityCard({ data = null, loading = false }) {
  const [manual, setManual]       = useState(null);
  const [editing, setEditing]     = useState(false);
  const [draft, setDraft]         = useState({});

  useEffect(() => {
    setManual(loadManual());
  }, []);

  const openEdit = () => {
    setDraft(manual || {
      score: '', mentions: '', citations: '', pagesReferenced: '',
      chatgpt: '', gemini: '', perplexity: '', copilot: '',
    });
    setEditing(true);
  };

  const saveDraft = () => {
    saveManual(draft);
    setManual(draft);
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5 animate-pulse">
        <div className="h-5 bg-surface-border rounded w-48 mb-4" />
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-surface-border rounded-xl" />)}
        </div>
        <div className="h-32 bg-surface-border rounded-xl" />
      </div>
    );
  }

  const scoreNum  = Number(manual?.score) || 0;
  const scoreColor =
    scoreNum >= 60 ? 'text-emerald-400' :
    scoreNum >= 30 ? 'text-yellow-400' :
    scoreNum >  0  ? 'text-red-400'    : 'text-slate-500';

  const scoreBg =
    scoreNum >= 60 ? 'bg-emerald-500/10 border-emerald-500/20' :
    scoreNum >= 30 ? 'bg-yellow-500/10 border-yellow-500/20'   :
    scoreNum >  0  ? 'bg-red-500/10 border-red-500/20'         : 'bg-surface-border/30 border-surface-border';

  const llmList = [
    { name: 'ChatGPT',    pct: manual?.chatgpt    },
    { name: 'Gemini',     pct: manual?.gemini     },
    { name: 'Perplexity', pct: manual?.perplexity },
    { name: 'Copilot',    pct: manual?.copilot    },
  ].filter(l => l.pct);

  return (
    <div className="bg-surface-card border border-purple-500/20 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={14} className="text-purple-400" />
        <h3 className="text-sm font-semibold text-slate-300">Visibilidade em IA (LLMs)</h3>
        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://pt.semrush.com/ai-seo/overview/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
          >
            SEMrush AI <ExternalLink size={9} />
          </a>
          <button
            onClick={openEdit}
            title="Sincronizar dados de IA manualmente"
            className="p-1 rounded-lg text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
          >
            {manual ? <Edit3 size={12} /> : <RefreshCw size={12} />}
          </button>
        </div>
      </div>

      {/* Modal de edição */}
      {editing && (
        <div className="mb-4 bg-surface-border/40 border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Info size={11} className="text-purple-400" />
              Cole os dados do{' '}
              <a href="https://pt.semrush.com/ai-seo/overview/" target="_blank" rel="noopener noreferrer" className="text-brand-500 underline">
                SEMrush AI SEO
              </a>
            </p>
            <button onClick={() => setEditing(false)}><X size={13} className="text-slate-500" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { key: 'score', label: 'Score (0–100)', ph: '34' },
              { key: 'mentions', label: 'Menções', ph: '73' },
              { key: 'citations', label: 'Citações', ph: '469' },
              { key: 'pagesReferenced', label: 'Páginas citadas', ph: '203' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[10px] text-slate-500 mb-0.5">{f.label}</label>
                <input
                  type="number"
                  placeholder={f.ph}
                  value={draft[f.key] || ''}
                  onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))}
                  className="w-full bg-surface-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mb-2">Distribuição por LLM (%) — opcional</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { key: 'chatgpt',    label: 'ChatGPT %',    ph: '9.6' },
              { key: 'gemini',     label: 'Gemini %',     ph: '61.6' },
              { key: 'perplexity', label: 'Perplexity %', ph: '15.1' },
              { key: 'copilot',    label: 'Copilot %',    ph: '13.7' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[10px] text-slate-500 mb-0.5">{f.label}</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={f.ph}
                  value={draft[f.key] || ''}
                  onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))}
                  className="w-full bg-surface-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            ))}
          </div>
          <button
            onClick={saveDraft}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold rounded-lg py-2 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Save size={11} /> Salvar dados de IA
          </button>
        </div>
      )}

      {manual ? (
        <>
          {/* KPIs principais */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className={`rounded-xl p-2.5 border ${scoreBg} col-span-1`}>
              <p className="text-[10px] text-slate-500 mb-0.5">Score</p>
              <p className={`text-xl font-bold ${scoreColor}`}>{manual.score || '—'}</p>
              <p className="text-[10px] text-slate-600">/100</p>
            </div>
            {[
              { label: 'Menções',       val: manual.mentions,        color: 'text-purple-400' },
              { label: 'Citações',      val: manual.citations,       color: 'text-blue-400'   },
              { label: 'Pág. citadas',  val: manual.pagesReferenced, color: 'text-cyan-400'   },
            ].map(k => (
              <div key={k.label} className="rounded-xl p-2.5 border border-surface-border bg-surface-border/20">
                <p className="text-[10px] text-slate-500 mb-0.5">{k.label}</p>
                <p className={`text-xl font-bold ${k.color}`}>{k.val || '—'}</p>
              </div>
            ))}
          </div>

          {/* Barra de distribuição por LLM */}
          {llmList.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                Distribuição por LLM
              </p>
              <div className="space-y-2">
                {llmList.map(l => (
                  <div key={l.name} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 w-16 shrink-0">{l.name}</span>
                    <div className="flex-1 h-1.5 bg-surface-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                        style={{ width: `${Math.min(Number(l.pct) || 0, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-purple-400 w-10 text-right">{l.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SERP Features da API */}
          {data && data.totalKeywordsAnalyzed > 0 && (
            <div className="border-t border-surface-border/40 pt-3">
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                SERP Features (Google)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-base font-bold text-emerald-400">{data.featuredSnippets}</p>
                  <p className="text-[10px] text-slate-500">Featured Snippets</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-blue-400">{data.keywordsWithFeatures}</p>
                  <p className="text-[10px] text-slate-500">Com SERP Feature</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-slate-300">{data.totalKeywordsAnalyzed}</p>
                  <p className="text-[10px] text-slate-500">Analisadas</p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Estado vazio */
        <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-4 text-center">
          <Bot size={20} className="mx-auto mb-2 text-purple-400/50" />
          <p className="text-xs text-slate-400 mb-1">
            Dados de visibilidade em LLMs não estão disponíveis via API padrão do SEMrush.
          </p>
          <p className="text-[11px] text-slate-500 mb-3">
            Acesse o{' '}
            <a
              href="https://pt.semrush.com/ai-seo/overview/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 underline"
            >
              SEMrush AI SEO
            </a>
            {' '}e sincronize os dados manualmente:
          </p>
          <button
            onClick={openEdit}
            className="inline-flex items-center gap-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-medium rounded-lg px-3 py-2 transition-colors"
          >
            <RefreshCw size={11} /> Sincronizar dados de IA
          </button>
        </div>
      )}
    </div>
  );
}
