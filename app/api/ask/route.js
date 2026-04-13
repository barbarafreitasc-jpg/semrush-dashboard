import { NextResponse } from 'next/server';

// ─── Anthropic / LLM integration (usa se ANTHROPIC_API_KEY estiver disponível) ──

async function callAnthropic(question, context) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 450,
        system: `Você é um analista sênior de SEO e marketing digital. Analise os dados reais fornecidos e responda a pergunta de forma direta, específica e acionável. Use os números exatos do contexto. Responda em português, texto corrido, sem bullet points nem markdown. Máximo 3 parágrafos objetivos. Foque no que o usuário pode fazer agora.`,
        messages: [
          {
            role: 'user',
            content: `Dados do domínio:\n${context}\n\nPergunta: ${question}`,
          },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.content?.[0]?.text || null;
  } catch {
    return null;
  }
}

// ─── Helpers de extração de contexto ────────────────────────────────────────────

function extractNum(ctx, ...keys) {
  for (const key of keys) {
    const m = ctx.match(new RegExp(key + '[^0-9-]*(\\d[\\d.,]*)'));
    if (m) return parseFloat(m[1].replace(',', '.'));
  }
  return null;
}

function extractDomain(ctx) {
  const m = ctx.match(/Dominio analisado:\s*([^\s\n]+)/i);
  return m ? m[1] : null;
}

function fmtN(n) {
  if (n === null || n === undefined) return 'N/D';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

// ─── Sistema de resposta por templates dinâmicos ──────────────────────────────

function gerarResposta(question, context) {
  const q = question.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const dominio     = extractDomain(context) || 'o domínio';
  const trafego     = extractNum(context, 'Trafego organico:', 'organico:');
  const keywords    = extractNum(context, 'Keywords organicas:');
  const authority   = extractNum(context, 'Authority Score:');
  const backlinks   = extractNum(context, 'Total de backlinks:');
  const dominios    = extractNum(context, 'Dominios referenciando:');
  const llmScore    = extractNum(context, 'Score LLM:');
  const mencoes     = extractNum(context, 'Mencoes:');
  const citacoes    = extractNum(context, 'Citacoes:');
  const googleAIO   = extractNum(context, 'Google AI Overview:');
  const aiMode      = extractNum(context, 'Google AI Mode:');
  const gemini      = extractNum(context, 'Gemini:');
  const chatgpt     = extractNum(context, 'ChatGPT:');

  // Extrai keywords específicas do contexto
  const kwMatches   = [...context.matchAll(/"([^"]+)" pos #(\d+) vol ([^\n]+)/g)].slice(0, 3);
  const topKw       = kwMatches[0] ? { kw: kwMatches[0][1], pos: kwMatches[0][2], vol: kwMatches[0][3] } : null;

  // Extrai quick wins
  const qwMatch     = context.match(/Quick wins \(pos 4-10\):\s*(\d+)/);
  const quickWins   = qwMatch ? Number(qwMatch[1]) : null;

  // Extrai concorrentes
  const compMatch   = [...context.matchAll(/- ([^\:]+):\s*([0-9KMk,.]+) visitas\/mes/g)].slice(0, 2);
  const topComp     = compMatch[0] ? { dom: compMatch[0][1].trim(), traffic: compMatch[0][2] } : null;

  // Intenção da pergunta
  const isTrafego    = /trafego|visita|acesso|queda|caiu|cresceu|crescimento|organico/.test(q);
  const isKeyword    = /keyword|palavra.chave|ranke|posicao|busca|termo|seo/.test(q);
  const isGeo        = /\bia\b|llm|gpt|gemini|score|mencao|citacao|geo|ai overview|aio|inteligencia/.test(q);
  const isCompetidor = /concorren|competidor|rival/.test(q);
  const isBacklink   = /backlink|link|autoridade|authority|dominio/.test(q);
  const isPago       = /pago|ads|cpc|anuncio|paid|google ads/.test(q);
  const isMelhorar   = /melhor|aumentar|crescer|como|estrategia|priorit|foco|melhorar/.test(q);

  // ─── Respostas por tópico ────────────────────────────────────────────────────

  if (isGeo) {
    const scoreLabel = !llmScore ? 'ainda não mensurado' : llmScore < 30 ? 'em estágio inicial' : llmScore < 60 ? 'em desenvolvimento' : 'consolidado';
    const aioStr = googleAIO !== null ? `${googleAIO}%` : 'não disponível';
    const geminiStr = gemini !== null ? `${gemini}%` : 'não mapeado';
    const chatgptStr = chatgpt !== null ? `${chatgpt}%` : 'não mapeado';

    if (llmScore !== null && llmScore >= 0) {
      const proximidade = llmScore < 40
        ? `O score em ${scoreLabel} significa que há bastante espaço para crescer. Com ${fmtN(mencoes)} menções e ${fmtN(citacoes)} citações mapeadas, a presença já existe — o trabalho é ampliar volume e consistência.`
        : `Com ${fmtN(mencoes)} menções e ${fmtN(citacoes)} citações, a marca já está referenciada nos principais modelos. O objetivo agora é manter o ritmo e expandir para tópicos adjacentes.`;

      return `O score de visibilidade em IA para ${dominio} está em ${llmScore !== null ? llmScore : 'N/D'}/100, ${scoreLabel}. ${proximidade}

O Google AI Overview concentra ${aioStr} das menções — é o canal com maior volume de buscas. Gemini está em ${geminiStr} e ChatGPT em ${chatgptStr}. Para crescer nesses últimos dois, o formato que funciona melhor é conteúdo em forma de resposta direta: perguntas frequentes do setor com respostas estruturadas, comparativos com dados quantitativos e páginas com fontes primárias citáveis.

Prioridade concreta: 2 a 3 novos conteúdos por mês focados em perguntas reais do público. Cada artigo bem estruturado com dados verificáveis tem potencial de adicionar menções ao score e aumentar a cobertura nos LLMs.`;
    }

    return `Os dados de IA/GEO para ${dominio} ainda não foram sincronizados no dashboard. Para ver o score de visibilidade em LLMs (ChatGPT, Gemini, Google AIO), acesse o SEMrush AI SEO em pt.semrush.com/ai-seo/overview/, busque o domínio e clique em "Sincronizar" na seção de Visibilidade em IA do dashboard.

Quando sincronizados, você verá: score total (0-100), número de menções, citações e a distribuição por modelo de IA. Esses dados mostram com que frequência os LLMs citam o domínio como referência.`;
  }

  if (isTrafego && !isMelhorar) {
    const trafegoStr = trafego !== null ? fmtN(trafego) : 'não disponível';
    const kwStr = keywords !== null ? fmtN(keywords) : 'N/D';
    const qwStr = quickWins !== null ? quickWins : 'algumas';
    const causas = trafego && trafego < 10000
      ? `Com ${trafegoStr} visitas/mês, o domínio ainda está em fase de crescimento orgânico. Prioridade deve ser aumentar a quantidade de keywords indexadas, não só recuperar posições.`
      : `O volume de ${trafegoStr} visitas/mês é gerado por ${kwStr} keywords indexadas.`;

    return `${causas} ${qwStr > 0 ? `Há ${qwStr} keywords nas posições 4-10 que são as maiores oportunidades de curto prazo — subir uma keyword do top 10 para o top 3 pode triplicar o tráfego daquela página.` : ''}

Quedas de tráfego geralmente têm 3 causas: perda de posição em keywords disputadas, mudanças de algoritmo afetando páginas específicas, ou redução sazonal de volume de busca. Para identificar qual é o caso, compare as posições das top 20 keywords com o mês anterior e isole quais URLs perderam mais cliques.

Ação imediata: revise as páginas que caíram do top 3 para posições 4-10 — são as com maior potencial de recuperação rápida. Atualize o conteúdo com dados recentes, reforce o título e a meta description, e adicione links internos apontando para essas páginas.`;
  }

  if (isKeyword) {
    const kwStr = keywords !== null ? fmtN(keywords) : 'N/D';
    const authStr = authority !== null ? authority : 'N/D';
    const qwStr = quickWins !== null ? quickWins : 'algumas';
    const topKwStr = topKw ? `A keyword de maior volume é "${topKw.kw}" (posição #${topKw.pos}, ${topKw.vol}/mês).` : '';

    return `${dominio} tem ${kwStr} keywords orgânicas posicionadas no top 100. Authority Score: ${authStr}/100. ${topKwStr}

Para priorização, foque em dois grupos: (1) keywords nas posições 4-10, que precisam de um ajuste cirúrgico para entrar no top 3 — ${qwStr} keywords se encaixam aqui e são as de maior retorno imediato; (2) keywords com CPC alto e posição acima de 10, que indicam intenção comercial forte — vale criar páginas dedicadas mais completas para cada uma.

Ação concreta: para as 5 keywords de maior volume nas posições 4-10, atualize título, H1 e adicione FAQ estruturado nas páginas correspondentes. Resultado esperado: melhora de posição em 30 a 60 dias.`;
  }

  if (isBacklink) {
    const asStr = authority !== null ? authority : 'N/D';
    const blStr = backlinks !== null ? fmtN(backlinks) : 'N/D';
    const domStr = dominios !== null ? fmtN(dominios) : 'N/D';
    const nivelAuth = authority !== null
      ? (authority < 30 ? 'abaixo do ideal para competir em keywords disputadas' : authority < 60 ? 'em nível médio, com espaço para crescer' : 'em nível competitivo')
      : '';

    return `${dominio} tem ${blStr} backlinks de ${domStr} domínios referenciando. Authority Score: ${asStr}/100 — ${nivelAuth}.

Para link building eficiente, os canais com melhor retorno são: portais e veículos do setor (artigos de guest post com links contextuais), associações e entidades do mercado (menções institucionais), e cobertura de imprensa especializada (assessoria de comunicação para temas técnicos ou estudos de caso). Evite links de diretórios genéricos sem relevância temática.

Prioridade: 3 a 5 links de qualidade por mês são suficientes para mover o Authority Score consistentemente. Concentre-se em domínios com authority acima de 50 e relevância temática clara — um link assim vale mais do que 50 links de sites irrelevantes.`;
  }

  if (isCompetidor) {
    const compStr = topComp ? `O maior concorrente identificado é ${topComp.dom} com ${topComp.traffic} visitas/mês.` : 'Os principais concorrentes estão identificados no gráfico do dashboard.';

    return `${compStr} A análise competitiva mostra os domínios com maior sobreposição de keywords em relação a ${dominio}.

A estratégia mais eficiente é identificar os conteúdos onde os concorrentes rankiam bem em posições 1-3 e onde ${dominio} está ausente ou acima de posição 10. Esses são gaps de conteúdo com potencial imediato — você já tem a prova de que há demanda (o concorrente está rankeando) e a lacuna para superar.

Ação concreta: pegue os top 3 concorrentes, filtre as keywords que eles rankeiam nas posições 1-3 onde ${dominio} não aparece ou está além da posição 10. Crie conteúdo mais completo, atualizado e com dados primários para cada uma. Foque nas que têm volume acima de 500 buscas/mês.`;
  }

  if (isPago) {
    return `Para tráfego pago, as páginas com maior potencial de ROI são as que já convertem organicamente mas perdem volume por sazonalidade ou concorrência em leilão. A lógica é simples: se o domínio já rankeia organicamente para uma keyword com alto CPC, é porque o conteúdo é relevante — complementar com paid amplifica o alcance sem pagar por tráfego frio.

Estrutura eficiente: landing pages separadas por produto ou intenção de compra, formulário de contato acima do fold, prova social (depoimentos, números de clientes) e CTA direto. Evite mandar tráfego pago para a home — taxa de conversão cai significativamente.

Teste prioritário: campanha de remarketing para visitantes que acessaram páginas de produto mas não converteram. Custo por clique é menor e a taxa de conversão é tipicamente 3 a 5x maior do que campanhas de prospecção fria.`;
  }

  if (isMelhorar) {
    const trafegoStr = trafego !== null ? fmtN(trafego) : null;
    const kwStr = keywords !== null ? fmtN(keywords) : null;
    const authStr = authority !== null ? authority : null;
    const qwStr = quickWins !== null ? quickWins : null;

    const dadosStr = [
      trafegoStr ? `${trafegoStr} visitas/mês` : null,
      kwStr ? `${kwStr} keywords posicionadas` : null,
      authStr ? `Authority Score ${authStr}/100` : null,
    ].filter(Boolean).join(', ');

    return `Com base nos dados atuais de ${dominio}${dadosStr ? ` (${dadosStr})` : ''}, as três prioridades com melhor relação esforço/resultado são:

(1) ${qwStr ? `${qwStr} keywords nas posições 4-10` : 'Keywords nas posições 4-10'} — subir essas para o top 3 pode dobrar ou triplicar o tráfego dessas páginas sem criar conteúdo novo, apenas otimizando o que já existe: título, H1, FAQ e links internos. (2) Publicar 2 conteúdos novos por mês focados em perguntas que o público faz — isso alimenta tanto o SEO tradicional quanto a visibilidade em LLMs, dois canais com crescimento simultâneo. (3) ${authority !== null && authority < 50 ? `Buscar 3 a 5 backlinks de portais do setor por mês para fortalecer o Authority Score de ${authority} — abaixo de 50 limita o crescimento em keywords mais competitivas.` : 'Fortalecer a estrutura de links internos entre páginas relacionadas — impacto rápido e sem custo.'}

Se precisar de análise mais específica, reformule a pergunta com o tópico: tráfego, keywords, IA/GEO, concorrentes ou backlinks.`;
  }

  // Resposta genérica contextual
  const dadosStr = [
    trafego !== null ? `tráfego de ${fmtN(trafego)} visitas/mês` : null,
    keywords !== null ? `${fmtN(keywords)} keywords posicionadas` : null,
    authority !== null ? `Authority Score ${authority}/100` : null,
    llmScore !== null ? `Score LLM ${llmScore}/100` : null,
  ].filter(Boolean).join(', ');

  return `Com base nos dados disponíveis para ${dominio}${dadosStr ? ` (${dadosStr})` : ''}, não identifiquei uma intenção específica na pergunta.

Para uma análise mais precisa, tente reformular mencionando o tópico específico: "Por que o tráfego caiu?", "Quais keywords priorizar?", "Como melhorar meu score de IA?", "Analise meus backlinks" ou "Quem são meus concorrentes?". Com o contexto certo, a resposta vai direto ao dado relevante.`;
}

export async function POST(request) {
  try {
    const { question, context } = await request.json();
    if (!question || !context) {
      return NextResponse.json({ answer: 'Pergunta ou contexto ausente.' });
    }

    // Tenta Anthropic primeiro se API key disponível
    const anthropicAnswer = await callAnthropic(question, context);
    if (anthropicAnswer) {
      return NextResponse.json({ answer: anthropicAnswer });
    }

    // Fallback: sistema de templates dinâmicos
    const answer = gerarResposta(question, context);
    return NextResponse.json({ answer });
  } catch (error) {
    return NextResponse.json({ answer: 'Erro ao processar sua pergunta. Tente novamente.' });
  }
}
