'use client';

import { useMemo } from 'react';
import { Lightbulb, TrendingDown, TrendingUp, Target, Users, Zap, Link2, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

function fmt(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n/1_000).toFixed(1)}K`;
  return String(n);
}

function trendPct(history) {
  if (!history || history.length < 3) return null;
  const recent = history.filter(h => h.traffic > 0).slice(0, 3);
  if (recent.length < 2) return null;
  const newest = recent[0].traffic;
  const oldest = recent[recent.length - 1].traffic;
  return oldest > 0 ? Math.round(((newest - oldest) / oldest) * 100) : null;
}

function generateInsights({ overview, history, keywords, competitors, backlinks, aiData, selectedPeriod }) {
  const insights = [];
  const kws = (keywords || []).filter(k => k.keyword && k.volume > 0);

  // ── 1. Tendência de tráfego ─────────────────────────────────────────────────
  const pct = trendPct(history);
  if (pct !== null && Math.abs(pct) >= 5) {
    const h3 = history.filter(h=>h.traffic>0).slice(0,3);
    const isDown = pct < 0;
    insights.push({
      type:  isDown ? 'warning' : 'success',
      icon:  isDown ? TrendingDown : TrendingUp,
      title: isDown
        ? `Tráfego em queda de ${Math.abs(pct)}% nos últimos 3 meses`
        : `Tráfego crescendo +${pct}% nos últimos 3 meses`,
      body: isDown
        ? `Queda de ${fmt(h3[h3.length-1].traffic)} para ${fmt(h3[0].traffic)} visitas. Conteúdos estão perdendo posicionamento.`
        : `Alta de ${fmt(h3[h3.length-1].traffic)} para ${fmt(h3[0].traffic)} visitas. Momento ideal para expandir conteúdo.`,
      action: isDown
        ? 'Audite as páginas que perderam tráfego. Atualize conteúdo, meta descriptions e internal links. Priorize as que caíram do top 3.'
        : 'Identifique as páginas que mais cresceram e produza conteúdo complementar para capturar buscas relacionadas.',
    });
  }

  // ── 2. Quick wins: keywords nas posições 4–10 ────────────────────────────────
  const quickWins = kws
    .filter(k => k.position >= 4 && k.position <= 10)
    .sort((a, b) => b.volume - a.volume);

  if (quickWins.length > 0) {
    const top = quickWins.slice(0, 3);
    insights.push({
      type:  'opportunity',
      icon:  Target,
      title: `${quickWins.length} keyword${quickWins.length > 1 ? 's' : ''} na iminência do top 3`,
      body:  `"${top.map(k => k.keyword).join('", "')}" estão nas posições 4–10 com bom volume. Subir ao top 3 pode triplicar o tráfego dessas páginas.`,
      action: `Atualize o conteúdo, título e H1 dessas páginas. Adicione links internos apontando para elas e capture backlinks específicos para cada URL.`,
    });
  }

  // ── 3. Keyword com maior potencial ─────────────────────────────────────────
  const topVol = kws.sort((a,b) => b.volume - a.volume).slice(0, 1)[0];
  const topCpc = kws.sort((a,b) => b.cpc - a.cpc).slice(0, 1)[0];
  const focusKw = topCpc && topCpc.cpc > 0 && topCpc.position > 3 ? topCpc : (topVol && topVol.position > 3 ? topVol : null);
  if (focusKw) {
    insights.push({
      type:   'focus',
      icon:   Zap,
      title:  `Palavra-chave prioritária: "${focusKw.keyword}"`,
      body:   `Volume ${fmt(focusKw.volume)}/mês · CPC R$${focusKw.cpc?.toFixed(2)} · Posição atual #${focusKw.position}. Alta intenção comercial e espaço para crescer.`,
      action: focusKw.position > 10
        ? `Crie conteúdo específico e profundo sobre "${focusKw.keyword}". Use FAQ estruturado e adicione schema markup. Conquiste backlinks de domínios do setor.`
        : `Fortaleça a página atual: atualize o conteúdo com dados recentes, melhore o tempo de carregamento e adicione FAQ com perguntas relacionadas.`,
    });
  }

  // ── 4. Gap de concorrentes ───────────────────────────────────────────────────
  if (competitors && competitors.length > 0 && overview) {
    const biggest = [...competitors].sort((a,b) => b.organicTraffic - a.organicTraffic)[0];
    const ratio   = Math.round((biggest.organicTraffic || 0) / (overview.organicTraffic || 1));
    if (ratio >= 2) {
      insights.push({
        type:   'competitor',
        icon:   Users,
        title:  `${biggest.domain} tem ${ratio}x mais tráfego orgânico`,
        body:   `${fmt(biggest.commonKeywords)} keywords em comum. Eles têm ${fmt(biggest.organicKeywords)} keywords orgânicas no total contra ${fmt(overview.organicKeywords)} suas.`,
        action: `Analise os conteúdos de ${biggest.domain} que aparecem em keywords que você já tem mas não rankeia bem. Crie versões mais completas e atuais no seu domínio.`,
      });
    }
  }

  // ── 5. Authority Score e backlinks ───────────────────────────────────────────
  if (backlinks?.overview) {
    const as = backlinks.overview.authorityScore || 0;
    if (as < 40) {
      insights.push({
        type:   'backlinks',
        icon:   Link2,
        title:  `Authority Score ${as}/100 — link building é prioridade`,
        body:   `${fmt(backlinks.overview.referringDomains)} domínios referenciando. Domínios com score abaixo de 40 têm dificuldade para ranquear em keywords mais disputadas.`,
        action: 'Priorize: guest posts em portais do setor (certificação digital, segurança da informação), parcerias com associações, menções em notícias e lista em diretórios relevantes.',
      });
    }
  }

  // ── 6. SERP Features e IA ────────────────────────────────────────────────────
  if (aiData) {
    const f = aiData.keywordsWithFeatures || 0;
    const t = aiData.totalKeywordsAnalyzed || 100;
    const pctF = t > 0 ? Math.round((f/t)*100) : 0;
    if (pctF < 30) {
      insights.push({
        type:   'ai',
        icon:   Lightbulb,
        title:  `Apenas ${pctF}% das keywords têm destaque na SERP — oportunidade para IA`,
        body:   `Somente ${f} das ${t} keywords analisadas aparecem em posições de destaque (featured snippets, knowledge panels). LLMs como ChatGPT e Gemini citam preferencialmente essas posições.`,
        action: 'Estruture conteúdo em formato de perguntas e respostas diretas. Use headers H2/H3 com as perguntas exatas, listas numeradas e tabelas. Priorize keywords informativas sobre certificação digital.',
      });
    } else {
      insights.push({
        type:   'success',
        icon:   Lightbulb,
        title:  `${pctF}% de presença em SERP Features — forte sinal para LLMs`,
        body:   `${f} keywords com destaque na SERP. Boa base para citações em IA. Ampliar essa cobertura aumenta diretamente a visibilidade em ChatGPT, Gemini e Perplexity.`,
        action: 'Identifique as keywords com maior volume onde você NÃO tem featured snippet e crie conteúdo de resposta direta para conquistá-las.',
      });
    }
  }

  return insights.slice(0, 5);
}

const typeStyles = {
  warning:    { bg: 'from-red-500/10 to-orange-500/5',    border: 'border-red-500/20',    badge: 'bg-red-500/15 text-red-400',      dot: 'bg-red-400'    },
  success:    { bg: 'from-emerald-500/10 to-teal-500/5',  border: 'border-emerald-500/20',badge: 'bg-emerald-500/15 text-emerald-400',dot: 'bg-emerald-400'},
  opportunity:{ bg: 'from-brand-500/10 to-blue-500/5',   border: 'border-brand-500/20',  badge: 'bg-brand-500/15 text-brand-400',   dot: 'bg-brand-400'  },
  focus:      { bg: 'from-yellow-500/10 to-amber-500/5',  border: 'border-yellow-500/20', badge: 'bg-yellow-500/15 text-yellow-400', dot: 'bg-yellow-400' },
  competitor: { bg: 'from-orange-500/10 to-red-500/5',    border: 'border-orange-500/20', badge: 'bg-orange-500/15 text-orange-400', dot: 'bg-orange-400' },
  backlinks:  { bg: 'from-purple-500/10 to-violet-500/5', border: 'border-purple-500/20', badge: 'bg-purple-500/15 text-purple-400', dot: 'bg-purple-400' },
  ai:         { bg: 'from-cyan-500/10 to-blue-500/5',     border: 'border-cyan-500/20',   badge: 'bg-cyan-500/15 text-cyan-400',     dot: 'bg-cyan-400'   },
};

const typeLabel = {
  warning:'Atenção', success:'Positivo', opportunity:'Oportunidade',
  focus:'Foco do mês', competitor:'Concorrência', backlinks:'Link Building', ai:'IA & SERP',
};

export default function InsightsBox({ overview, history, keywords, competitors, backlinks, aiData, loading, selectedPeriod }) {
  const insights = useMemo(
    () => generateInsights({ overview, history, keywords, competitors, backlinks, aiData, selectedPeriod }),
    [overview, history, keywords, competitors, backlinks, aiData, selectedPeriod]
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-yellow-500/3 p-5 animate-pulse">
        <div className="h-5 bg-surface-border rounded w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-surface-border/50 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!insights.length) return null;

  const isHistorical = selectedPeriod && selectedPeriod !== 'current';

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/8 to-yellow-500/3 p-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <Lightbulb size={14} className="text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-amber-300">Insights</h3>
          <p className="text-[10px] text-slate-500">
            {isHistorical ? 'Análise do período selecionado' : 'O que fazer no próximo mês'}
          </p>
        </div>
        <div className="ml-auto">
          <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5 font-medium">
            {insights.length} recomendações
          </span>
        </div>
      </div>

      {/* Grid de insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {insights.map((ins, i) => {
          const s   = typeStyles[ins.type] || typeStyles.opportunity;
          const Icon = ins.icon;
          return (
            <div
              key={i}
              className={`rounded-xl border bg-gradient-to-br ${s.bg} ${s.border} p-3.5 flex flex-col gap-2`}
            >
              {/* Badge + título */}
              <div className="flex items-start gap-2">
                <div className={`w-5 h-5 rounded-lg ${s.badge} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon size={11} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-[9px] font-semibold uppercase tracking-wider ${s.badge.split(' ')[1]} opacity-80`}>
                    {typeLabel[ins.type]}
                  </span>
                  <p className="text-xs font-semibold text-white leading-tight mt-0.5">{ins.title}</p>
                </div>
              </div>

              {/* Corpo */}
              <p className="text-[11px] text-slate-400 leading-relaxed">{ins.body}</p>

              {/* Ação */}
              <div className="mt-auto pt-1 border-t border-white/5">
                <div className="flex items-start gap-1.5">
                  <ArrowRight size={9} className="text-slate-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{ins.action}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
