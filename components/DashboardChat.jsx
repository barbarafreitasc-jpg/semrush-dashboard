'use client';
import { useState, useEffect } from 'react';
import { MessageCircle, Send, Bot, Loader2, X } from 'lucide-react';

function fmt(n) {
  if (!n && n !== 0) return '-';
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n/1000).toFixed(1) + 'K';
  return String(n);
}

export default function DashboardChat({ overview, keywords, competitors, backlinks }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [asked, setAsked]       = useState(false);
  const [llmData, setLlmData]   = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('semrush_ai_llm_v2');
      if (raw) setLlmData(JSON.parse(raw));
    } catch {}
  }, []);

  const buildContext = () => {
    let ctx = 'Dominio analisado: bry.com.br (empresa de certificacao digital brasileira)\n\n';
    if (overview) {
      ctx += 'SEO Overview:\n';
      ctx += '- Trafego organico: ' + fmt(overview.organicTraffic) + ' visitas/mes\n';
      ctx += '- Keywords organicas: ' + fmt(overview.organicKeywords) + '\n';
      ctx += '- Authority Score: ' + (overview.authorityScore || 'N/A') + '/100\n\n';
    }
    if (backlinks?.overview) {
      ctx += 'Backlinks:\n- Total: ' + fmt(backlinks.overview.total) + '\n- Dominios: ' + fmt(backlinks.overview.referringDomains) + '\n\n';
    }
    if (keywords && keywords.length > 0) {
      ctx += 'Top 5 keywords:\n';
      keywords.slice(0, 5).forEach(k => {
        ctx += '- "' + k.keyword + '" pos #' + k.position + ' vol ' + fmt(k.volume) + '/mes\n';
      });
      ctx += '- Quick wins (pos 4-10): ' + keywords.filter(k => k.position >= 4 && k.position <= 10).length + ' keywords\n\n';
    }
    if (competitors && competitors.length > 0) {
      ctx += 'Concorrentes:\n';
      competitors.slice(0, 3).forEach(c => { ctx += '- ' + c.domain + ': ' + fmt(c.organicTraffic) + ' visitas/mes\n'; });
      ctx += '\n';
    }
    if (llmData) {
      ctx += 'GEO/IA: Score ' + llmData.score + '/100, ' + llmData.mentions + ' mencoes, ' + llmData.citations + ' citacoes\n';
      ctx += 'Google AIO: ' + llmData.googleaio + '%, AI Mode: ' + llmData.aimode + '%, Gemini: ' + llmData.gemini + '%, ChatGPT: ' + llmData.chatgpt + '%\n';
    }
    return ctx;
  };

  const handleAsk = async () => {
    if (!question.trim() || loading) return;
    setLoading(true); setAsked(true); setAnswer('');
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), context: buildContext() }),
      });
      const data = await res.json();
      setAnswer(data.answer || 'Sem resposta.');
    } catch { setAnswer('Erro ao processar. Tente novamente.'); }
    finally { setLoading(false); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); } };
  const handleReset = () => { setQuestion(''); setAnswer(''); setAsked(false); setLoading(false); };

  const suggestions = ['Por que o trafego caiu?', 'Como melhorar meu score de IA?', 'Quais keywords priorizar?'];

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/3 p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <Bot size={14} className="text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-violet-300">Tire suas duvidas</h3>
          <p className="text-[10px] text-slate-500">Pergunte qualquer coisa sobre os dados do dashboard</p>
        </div>
      </div>
      {!asked ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Ex: Por que o trafego caiu? Como melhorar meu score de IA?"
              className="flex-1 bg-gray-900/60 border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/60 transition-colors" />
            <button onClick={handleAsk} disabled={!question.trim()}
              className="p-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center">
              <Send size={14} className="text-white" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => setQuestion(s)}
                className="text-[10px] text-slate-400 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/60 rounded-lg px-2.5 py-1 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-2 bg-gray-800/40 rounded-xl p-3 border border-gray-700/40">
            <MessageCircle size={13} className="text-slate-400 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-300 flex-1">{question}</p>
            <button onClick={handleReset} className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 ml-1"><X size={13} /></button>
          </div>
          {loading ? (
            <div className="flex items-center gap-2.5 p-3 bg-violet-500/5 rounded-xl border border-violet-500/10">
              <Loader2 size={14} className="text-violet-400 animate-spin shrink-0" />
              <span className="text-sm text-slate-400">Analisando os dados do dashboard...</span>
            </div>
          ) : (
            <div className="bg-violet-500/8 border border-violet-500/20 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={11} className="text-violet-400" />
                </div>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{answer}</p>
              </div>
            </div>
          )}
          {!loading && <button onClick={handleReset} className="text-[11px] text-slate-500 hover:text-violet-400 transition-colors">&larr; Nova pergunta</button>}
        </div>
      )}
    </div>
  );
}
