'use client';

import { useMemo, useState, useEffect } from 'react';
import { Lightbulb, TrendingDown, TrendingUp, Target, Users, Zap, Link2, ArrowRight, Bot, Sparkles, Radio } from 'lucide-react';

function fmt(n) {
  if (!n && n !== 0) return '-';
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n/1000).toFixed(1) + 'K';
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

function generateInsights({ overview, history, keywords, competitors, backlinks, aiData, llmData, selectedPeriod }) {
  const seoInsights = [];
  const geoInsights = [];
  const kws = (keywords || []).filter(k => k.keyword && k.volume > 0);

  const llmScore = Number(llmData?.score) || 0;
  const llmMentions = Number(llmData?.mentions) || 0;
  const llmCitations = Number(llmData?.citations) || 0;
  const llmPages = Number(llmData?.pages) || 0;
  const googleAIOPct = Number(llmData?.googleaio) || 0;
  const aiModePct = Number(llmData?.aimode) || 0;
  const geminiPct = Number(llmData?.gemini) || 0;
  const chatgptPct = Number(llmData?.chatgpt) || 0;

  if (llmScore > 0 || llmMentions > 0) {
    if (llmScore < 40) {
      geoInsights.push({
        type: 'geo_warn', icon: Bot,
        title: 'Score LLM ' + llmScore + '/100 - presenca em IA critica',
        body: fmt(llmMentions) + ' mencoes e ' + fmt(llmCitations) + ' citacoes em LLMs. Score abaixo de 40 indica que a marca raramente aparece nas respostas de ChatGPT, Gemini e Google AIO.',
        action: 'Publique conteudo de resposta direta as perguntas mais frequentes sobre certificacao digital. Crie glossarios, estudos de caso com dados reais e guias definitivos. Conquiste mencoes em portais com alta autoridade citados pelos LLMs.',
      });
    } else if (llmScore < 70) {
      geoInsights.push({
        type: 'geo', icon: Bot,
        title: 'Score LLM ' + llmScore + '/100 - crescimento em IA possivel',
        body: fmt(llmMentions) + ' mencoes e ' + fmt(llmCitations) + ' citacoes. Visibilidade moderada - ha espaco relevante para ganhar mais citacoes nos principais LLMs.',
        action: 'Expanda o conteudo informacional: adicione dados quantitativos, pesquisas setoriais e comparacoes que os LLMs tendem a citar. Atualize paginas existentes com informacoes mais recentes.',
      });
    } else {
      geoInsights.push({
        type: 'geo_success', icon: Bot,
        title: 'Score LLM ' + llmScore + '/100 - boa presenca em IA',
        body: fmt(llmMentions) + ' mencoes e ' + fmt(llmCitations) + ' citacoes. Solida visibilidade nos LLMs. Momento ideal para ampliar cobertura em novos topicos.',
        action: 'Identifique topicos adjacentes (assinatura eletronica, compliance, LGPD) onde ainda nao e citado e crie conteudo definitivo para cada um.',
      });
    }

    if (googleAIOPct > 50) {
      const othersTotal = Math.round((chatgptPct || 0) + (geminiPct || 0) + (aiModePct || 0));
      geoInsights.push({
        type: 'geo', icon: Radio,
        title: googleAIOPct + '% das mencoes via Google AIO - diversifique LLMs',
        body: 'Concentracao alta no Google AI Overview. ChatGPT + Gemini representam apenas ~' + othersTotal + '% das mencoes. Queda no AIO impacta toda a visibilidade em IA de uma vez.',
        action: 'Adapte conteudo ao perfil de cada LLM: ChatGPT prioriza fontes com dados concretos e estudos; Gemini valoriza estrutura clara com headers e listas. Publique em formatos variados para ampliar presenca alem do Google.',
      });
    } else if (chatgptPct > 0 || geminiPct > 0) {
      const topLLM = chatgptPct > geminiPct ? ('ChatGPT (' + chatgptPct + '%)') : ('Gemini (' + geminiPct + '%)');
      geoInsights.push({
        type: 'geo_success', icon: Sparkles,
        title: 'Presenca distribuida entre LLMs - estrategia GEO equilibrada',
        body: topLLM + ' lidera, com Google AIO em ' + googleAIOPct + '%. Diversificacao saudavel reduz dependencia de um unico modelo e amplia alcance total.',
        action: 'Mantenha o ritmo de publicacao e foque em aumentar o volume de citacoes em ChatGPT e Gemini com conteudo rico em dados, comparacoes e respostas objetivas.',
      });
    }

    if (llmMentions > 0 && llmCitations > 0) {
      const ratio = Math.round(llmCitations / llmMentions);
      if (ratio >= 5) {
        geoInsights.push({
          type: 'geo_success', icon: Sparkles,
          title: fmt(llmCitations) + ' citacoes para ' + fmt(llmMentions) + ' mencoes - conteudo e referencia',
          body: 'Proporcao de ' + ratio + 'x citacoes por mencao indica que os LLMs usam seu conteudo como fonte de autoridade. Sinal forte de E-E-A-T para IA.',
          action: 'Amplie a quantidade de paginas que funcionam como referencia. Atualize dados trimestralmente para manter relevancia e evitar que citacoes caiam por informacoes desatualizadas.',
        });
      }
    }
  }

  const pct = trendPct(history);
  if (pct !== null && Math.abs(pct) >= 5) {
    const h3 = history.filter(h=>h.traffic>0).slice(0,3);
    const isDown = pct < 0;
    seoInsights.push({
      type: isDown ? 'warning' : 'success', icon: isDown ? TrendingDown : TrendingUp,
      title: isDown ? ('Trafego em queda de ' + Math.abs(pct) + '% nos ultimos 3 meses') : ('Trafego crescendo +' + pct + '% nos ultimos 3 meses'),
      body: isDown
        ? ('Queda de ' + fmt(h3[h3.length-1].traffic) + ' para ' + fmt(h3[0].traffic) + ' visitas. Conteudos estao perdendo posicionamento.')
        : ('Alta de ' + fmt(h3[h3.length-1].traffic) + ' para ' + fmt(h3[0].traffic) + ' visitas. Momento ideal para expandir conteudo.'),
      action: isDown ? 'Audite as paginas que perderam trafego. Atualize conteudo, meta descriptions e internal links. Priorize as que cairam do top 3.' : 'Identifique as paginas que mais cresceram e produza conteudo complementar para capturar buscas relacionadas.',
    });
  }

  const quickWins = kws.filter(k => k.position >= 4 && k.position <= 10).sort((a, b) => b.volume - a.volume);
  if (quickWins.length > 0) {
    const top = quickWins.slice(0, 3);
    seoInsights.push({
      type: 'opportunity', icon: Target,
      title: quickWins.length + ' keyword' + (quickWins.length > 1 ? 's' : '') + ' na iminencia do top 3',
      body: '"' + top.map(k => k.keyword).join('", "') + '" estao nas posicoes 4-10 com bom volume. Subir ao top 3 pode triplicar o trafego dessas paginas.',
      action: 'Atualize o conteudo, titulo e H1 dessas paginas. Adicione links internos apontando para elas e capture backlinks especificos para cada URL.',
    });
  }

  const sortedCpc = [...kws].sort((a,b) => b.cpc - a.cpc);
  const sortedVol = [...kws].sort((a,b) => b.volume - a.volume);
  const topCpc = sortedCpc[0];
  const topVol = sortedVol[0];
  const focusKw = topCpc && topCpc.cpc > 0 && topCpc.position > 3 ? topCpc : (topVol && topVol.position > 3 ? topVol : null);
  if (focusKw) {
    seoInsights.push({
      type: 'focus', icon: Zap,
      title: 'Palavra-chave prioritaria: "' + focusKw.keyword + '"',
      body: 'Volume ' + fmt(focusKw.volume) + '/mes * CPC R$' + (focusKw.cpc?.toFixed(2)) + ' * Posicao atual #' + focusKw.position + '. Alta intencao comercial e espaco para crescer.',
      action: focusKw.position > 10
        ? ('Crie conteudo especifico e profundo sobre "' + focusKw.keyword + '". Use FAQ estruturado e adicione schema markup. Conquiste backlinks de dominios do setor.')
        : 'Fortaleca a pagina atual: atualize o conteudo com dados recentes, melhore o tempo de carregamento e adicione FAQ com perguntas relacionadas.',
    });
  }

  if (competitors && competitors.length > 0 && overview) {
    const biggest = [...competitors].sort((a,b) => b.organicTraffic - a.organicTraffic)[0];
    const ratio = Math.round((biggest.organicTraffic || 0) / (overview.organicTraffic || 1));
    if (ratio >= 2) {
      seoInsights.push({
        type: 'competitor', icon: Users,
        title: biggest.domain + ' tem ' + ratio + 'x mais trafego organico',
        body: fmt(biggest.commonKeywords) + ' keywords em comum. Eles tem ' + fmt(biggest.organicKeywords) + ' keywords organicas no total contra ' + fmt(overview.organicKeywords) + ' suas.',
        action: 'Analise os conteudos de ' + biggest.domain + ' que aparecem em keywords que voce ja tem mas nao rankeia bem. Crie versoes mais completas e atuais no seu dominio.',
      });
    }
  }

  if (backlinks?.overview) {
    const as = backlinks.overview.authorityScore || 0;
    if (as < 40) {
      seoInsights.push({
        type: 'backlinks', icon: Link2,
        title: 'Authority Score ' + as + '/100 - link building e prioridade',
        body: fmt(backlinks.overview.referringDomains) + ' dominios referenciando. Dominios com score abaixo de 40 tem dificuldade para ranquear em keywords mais disputadas.',
        action: 'Priorize: guest posts em portais do setor (certificacao digital, seguranca da informacao), parcerias com associacoes, mencoes em noticias e lista em diretorios relevantes.',
      });
    }
  }

  return [...geoInsights.slice(0, 2), ...seoInsights.slice(0, 4)].slice(0, 6);
}

const typeStyles = {
  warning:    { bg: 'from-red-500/10 to-orange-500/5',    border: 'border-red-500/20',    badge: 'bg-red-500/15 text-red-400'        },
  success:    { bg: 'from-emerald-500/10 to-teal-500/5',  border: 'border-emerald-500/20',badge: 'bg-emerald-500/15 text-emerald-400' },
  opportunity:{ bg: 'from-brand-500/10 to-blue-500/5',   border: 'border-brand-500/20',  badge: 'bg-brand-500/15 text-brand-400'    },
  focus:      { bg: 'from-yellow-500/10 to-amber-500/5',  border: 'border-yellow-500/20', badge: 'bg-yellow-500/15 text-yellow-400'  },
  competitor: { bg: 'from-orange-500/10 to-red-500/5',    border: 'border-orange-500/20', badge: 'bg-orange-500/15 text-orange-400'  },
  backlinks:  { bg: 'from-purple-500/10 to-violet-500/5', border: 'border-purple-500/20', badge: 'bg-purple-500/15 text-purple-400'  },
  ai:         { bg: 'from-cyan-500/10 to-blue-500/5',     border: 'border-cyan-500/20',   badge: 'bg-cyan-500/15 text-cyan-400'      },
  geo:        { bg: 'from-teal-500/10 to-cyan-500/5',     border: 'border-teal-500/30',   badge: 'bg-teal-500/20 text-teal-300'      },
  geo_warn:   { bg: 'from-rose-500/10 to-pink-500/5',     border: 'border-rose-500/30',   badge: 'bg-rose-500/20 text-rose-300'      },
  geo_success:{ bg: 'from-sky-500/10 to-teal-500/5',      border: 'border-sky-500/30',    badge: 'bg-sky-500/20 text-sky-300'        },
};

const typeLabel = {
  warning:'Atencao SEO', success:'Positivo', opportunity:'Oportunidade',
  focus:'Foco do mes', competitor:'Concorrencia', backlinks:'Link Building', ai:'IA & SERP',
  geo:'GEO / IA', geo_warn:'GEO Urgente', geo_success:'GEO Positivo',
};

export default function InsightsBox({ overview, history, keywords, competitors, backlinks, aiData, loading, selectedPeriod }) {
  const [llmData, setLlmData] = useState(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('semrush_ai_llm_v2');
      if (raw) setLlmData(JSON.parse(raw));
    } catch {}
  }, []);

  const insights = useMemo(
    () => generateInsights({ overview, history, keywords, competitors, backlinks, aiData, llmData, selectedPeriod }),
    [overview, history, keywords, competitors, backlinks, aiData, llmData, selectedPeriod]
  );

  if (loading) return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-yellow-500/3 p-5 animate-pulse">
      <div className="h-5 bg-surface-border rounded w-32 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {[1,2,3].map(i => <div key={i} className="h-28 bg-surface-border/50 rounded-xl" />)}
      </div>
    </div>
  );

  if (!insights.length) return null;

  const geoCount = insights.filter(i => i.type.startsWith('geo')).length;
  const isHistorical = selectedPeriod && selectedPeriod !== 'current';

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/8 to-yellow-500/3 p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <Lightbulb size={14} className="text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-amber-300">Insights</h3>
          <p className="text-[10px] text-slate-500">{isHistorical ? 'Analise do periodo selecionado' : 'O que fazer no proximo mes'}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {geoCount > 0 && (
            <span className="text-[10px] bg-teal-500/15 text-teal-400 border border-teal-500/20 rounded-full px-2 py-0.5 font-medium flex items-center gap-1">
              <Bot size={9} /> {geoCount} GEO
            </span>
          )}
          <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5 font-medium">
            {insights.length} recomendacoes
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {insights.map((ins, i) => {
          const s = typeStyles[ins.type] || typeStyles.opportunity;
          const Icon = ins.icon;
          const isGeo = ins.type.startsWith('geo');
          return (
            <div key={i} className={'rounded-xl border bg-gradient-to-br ' + s.bg + ' ' + s.border + ' p-3.5 flex flex-col gap-2' + (isGeo ? ' ring-1 ring-teal-500/10' : '')}>
              <div className="flex items-start gap-2">
                <div className={'w-5 h-5 rounded-lg ' + s.badge + ' flex items-center justify-center shrink-0 mt-0.5'}>
                  <Icon size={11} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={'text-[9px] font-semibold uppercase tracking-wider ' + s.badge.split(' ')[1] + ' opacity-80'}>{typeLabel[ins.type]}</span>
                    {isGeo && <span className="text-[8px] bg-teal-500/20 text-teal-400 rounded px-1 py-px font-bold">GEO</span>}
                  </div>
                  <p className="text-xs font-semibold text-white leading-tight mt-0.5">{ins.title}</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{ins.body}</p>
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
