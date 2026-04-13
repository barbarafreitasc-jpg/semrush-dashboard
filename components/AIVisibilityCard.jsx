'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Bot, ExternalLink, Edit3, Save, X, RefreshCw, Zap } from 'lucide-react';

const LS_KEY = 'semrush_ai_llm_v2';

function loadLocal() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { return null; }
}
function saveLocal(data) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

async function syncToServer(data) {
  try {
    await fetch('/api/llm-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {}
}

const LLM_FIELDS = [
  { k: 'googleaio', l: 'Google AIO',     color: 'bg-blue-500'    },
  { k: 'aimode',    l: 'Google AI Mode', color: 'bg-cyan-500'    },
  { k: 'gemini',    l: 'Gemini',         color: 'bg-purple-500'  },
  { k: 'chatgpt',   l: 'ChatGPT',        color: 'bg-emerald-500' },
];

export default function AIVisibilityCard({ data = null, loading = false }) {
  const [llm,     setLlm]     = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState({});

  useEffect(() => {
    let cancelled = false;
    fetch('/api/llm-data', { cache: 'no-store' })
      .then(r => r.json())
      .then(serverData => {
        if (cancelled) return;
        const local = loadLocal();
        if (serverData && serverData.syncedAt) {
          setLlm(serverData);
          saveLocal(serverData);
        } else if (local) {
          setLlm(local);
          syncToServer(local);
        }
      })
      .catch(() => {
        if (!cancelled) setLlm(loadLocal());
      });
    return () => { cancelled = true; };
  }, []);

  const openEdit = () => {
    setDraft(llm || { score:'', mentions:'', citations:'', pages:'', googleaio:'', aimode:'', gemini:'', chatgpt:'' });
    setEditing(true);
  };

  const save = () => {
    const toSave = { ...draft, syncedAt: new Date().toISOString() };
    saveLocal(toSave);
    setLlm(toSave);
    setEditing(false);
    syncToServer(toSave);
  };

  if (loading) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5 animate-pulse h-52">
        <div className="h-5 bg-surface-border rounded w-48 mb-4" />
        <div className="h-full bg-surface-border rounded" />
      </div>
    );
  }

  const score    = data?.visibilityScore ?? 0;
  const features = data?.keywordsWithFeatures ?? 0;
  const topList  = data?.topFeaturedSnippets ?? data?.topKeywords ?? [];
  const total    = data?.totalKeywordsAnalyzed ?? 0;
  const llmScore = Number(llm?.score) || 0;

  const scoreColor =
    llmScore >= 60 ? 'text-emerald-400' :
    llmScore >= 30 ? 'text-yellow-400'  :
    llmScore >  0  ? 'text-orange-400'  : 'text-slate-500';

  const llmBars = llm
    ? LLM_FIELDS.map(f => ({ ...f, v: llm[f.k] })).filter(f => f.v && Number(f.v) > 0)
    : [];

  return (
    <div className="bg-surface-card border border-purple-500/20 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={14} className="text-purple-400" />
        <h3 className="text-sm font-semibold text-slate-300">Visibilidade em IA</h3>
        <div className="ml-auto flex items-center gap-2">
          <a href="https://pt.semrush.com/ai-seo/overview/" target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-purple-400/70 hover:text-purple-300 flex items-center gap-0.5">
            SEMrush AI <ExternalLink size={8} />
          </a>
          <button onClick={openEdit} title="Sincronizar dados LLM"
            className="p-1 rounded-lg text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors">
            <Edit3 size={11} />
          </button>
        </div>
      </div>

      {editing && (
        <div className="mb-4 bg-surface-border/40 border border-purple-500/20 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-slate-300">
              Cole os dados do{' '}
              <a href="https://pt.semrush.com/ai-seo/overview/" target="_blank" rel="noopener noreferrer" className="text-brand-500 underline">
                SEMrush AI SEO
              </a>
            </p>
            <button onClick={() => setEditing(false)}><X size={12} className="text-slate-500" /></button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {[
              { k:'score',    l:'Score (0-100)', p:'34'  },
              { k:'mentions', l:'Mencoes',       p:'73'  },
              { k:'citations',l:'Citacoes',      p:'469' },
              { k:'pages',    l:'Pags. citadas', p:'203' },
            ].map(f => (
              <div key={f.k}>
                <label className="block text-[10px] text-slate-500 mb-0.5">{f.l}</label>
                <input type="number" placeholder={f.p} value={draft[f.k]||''}
                  onChange={e => setDraft(d=>({...d,[f.k]:e.target.value}))}
                  className="w-full bg-surface-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500" />
              </div>
            ))}
          </div>
          <p className="text-[9px] text-slate-600 mb-1.5">Distribuicao LLM % (opcional)</p>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {LLM_FIELDS.map(f => (
              <div key={f.k}>
                <label className="block text-[10px] text-slate-500 mb-0.5">{f.l} %</label>
                <input type="number" step="0.1" value={draft[f.k]||''}
                  onChange={e => setDraft(d=>({...d,[f.k]:e.target.value}))}
                  className="w-full bg-surface-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500" />
              </div>
            ))}
          </div>
          <button onClick={save}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold rounded-lg py-1.5 flex items-center justify-center gap-1.5 transition-colors">
            <Save size={10} /> Salvar e sincronizar
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Bot size={9} /> LLM Visibility
          </p>
          {llm && (llm.score || llm.mentions) ? (
            <>
              <div className="flex items-end gap-1.5">
                <span className={`text-3xl font-bold ${scoreColor}`}>{llm.score || '-'}</span>
                <span className="text-xs text-slate-500 mb-1">/100</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[{l:'Mencoes',v:llm.mentions},{l:'Citacoes',v:llm.citations},{l:'Pags.',v:llm.pages}].map(m=>(
                  <div key={m.l} className="bg-surface-border/30 rounded-lg p-1.5 text-center">
                    <p className="text-[9px] text-slate-500">{m.l}</p>
                    <p className="text-sm font-bold text-purple-400">{m.v || '-'}</p>
                  </div>
                ))}
              </div>
              {llmBars.length > 0 && (
                <div className="space-y-1">
                  {llmBars.map(l => (
                    <div key={l.k} className="flex items-center gap-1.5">
                      <span className="text-[9px] text-slate-500 w-16 shrink-0 truncate">{l.l}</span>
                      <div className="flex-1 h-1 bg-surface-border rounded-full overflow-hidden">
                        <div className={`h-full ${l.color} rounded-full opacity-80`}
                          style={{width:`${Math.min(Number(l.v)||0,100)}%`}} />
                      </div>
                      <span className="text-[9px] text-purple-400 w-8 text-right">{l.v}%</span>
                    </div>
                  ))}
                </div>
              )}
              {llm.syncedAt && (
                <p className="text-[9px] text-slate-600">
                  Sync: {new Date(llm.syncedAt).toLocaleDateString('pt-BR')}
                </p>
              )}
            </>
          ) : (
            <div className="bg-purple-500/5 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-500 mb-2">
                Dados do SEMrush AI SEO requerem sync manual
              </p>
              <button onClick={openEdit}
                className="inline-flex items-center gap-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-medium rounded-lg px-2.5 py-1.5 transition-colors">
                <RefreshCw size={9} /> Sincronizar
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Zap size={9} /> SERP Features (Google)
          </p>
          <div className="flex items-end gap-1.5">
            <span className="text-3xl font-bold text-emerald-400">{features}</span>
            <span className="text-xs text-slate-500 mb-1">/{total}</span>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-slate-500">Keywords com destaque</span>
              <span className="text-[9px] font-semibold text-emerald-400">{score}%</span>
            </div>
            <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                style={{width:`${Math.min(score,100)}%`}} />
            </div>
          </div>
          {topList.length > 0 && (
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {topList.slice(0,6).map((k,i)=>(
                <div key={i} className="flex items-center gap-1.5 bg-surface-border/20 rounded px-1.5 py-1">
                  <span className="text-[9px] text-slate-600 w-3">{i+1}</span>
                  <span className="text-[10px] text-slate-300 flex-1 truncate">{k.keyword}</span>
                  <span className={`text-[9px] font-bold px-1 rounded ${k.position<=3?'text-emerald-400':'text-slate-400'}`}>
                    #{k.position}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
