import { NextResponse } from 'next/server';

// Extrai um valor numérico do contexto por chave
function extractNum(ctx, ...keys) {
  for (const key of keys) {
    const m = ctx.match(new RegExp(key + '[^0-9]*(\\d[\\d.,]*)'));
    if (m) return parseFloat(m[1].replace(',', '.'));
  }
  return null;
}

// Extrai texto por padrão
function extractText(ctx, pattern) {
  const m = ctx.match(pattern);
  return m ? m[1]?.trim() : null;
}

function gerarResposta(question, context) {
  const q = question.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Extrair dados do contexto
  const trafego    = extractNum(context, 'Trafego organico:', 'organico:');
  const keywords   = extractNum(context, 'Keywords organicas:');
  const authority  = extractNum(context, 'Authority Score:');
  const backlinks  = extractNum(context, 'Total de backlinks:');
  const dominios   = extractNum(context, 'Dominios referenciando:');
  const llmScore   = extractNum(context, 'Score LLM:');
  const mencoes    = extractNum(context, 'Mencoes:');
  const citacoes   = extractNum(context, 'Citacoes:');
  const googleAIO  = extractNum(context, 'Google AI Overview:');
  const aiMode     = extractNum(context, 'Google AI Mode:');
  const gemini     = extractNum(context, 'Gemini:');
  const chatgpt    = extractNum(context, 'ChatGPT:');

  // Keywords relevantes da pergunta
  const isTrafego    = /trafego|visita|acesso|queda|caiu|cresceu|crescimento|organico/.test(q);
  const isKeyword    = /keyword|palavra.chave|ranke|posicao|busca|termo|seo/.test(q);
  const isGeo        = /ia|llm|gpt|gemini|score|mencao|citacao|geo|ai overview|aio|inteligencia/.test(q);
  const isCompetidor = /concorren|competidor|rival/.test(q);
  const isBacklink   = /backlink|link|autoridade|authority|dominio/.test(q);
  const isPago       = /pago|ads|cpc|anuncio|paid|google ads/.test(q);
  const isPagina     = /pagina|url|page|conteudo|post|artigo/.test(q);
  const isMelhorar   = /melhor|aumentar|crescer|como|estrategia|priorit|foco/.test(q);

  // IA / GEO
  if (isGeo) {
    const scoreLabel = llmScore < 40 ? 'ainda abaixo do esperado' : llmScore < 70 ? 'em desenvolvimento' : 'solido';
    const aioLabel   = googleAIO > 60 ? 'lidera com folga' : googleAIO > 40 ? 'tem boa presenca' : 'ainda tem espaco para crescer';
    return `O score de visibilidade em IA esta em ${llmScore || 'N/A'}/100, ${scoreLabel}. Com ${mencoes || 0} mencoes e ${citacoes || 0} citacoes mapeadas, a marca ja aparece nos principais LLMs — o volume e real, mas ha espaco para escalar.

O Google AIO concentra ${googleAIO || 0}% das mencoes e ${aioLabel} nesse canal. Gemini (${gemini || 0}%) e ChatGPT (${chatgpt || 0}%) sao os proximos fronts prioritarios: publique conteudo em formato de resposta direta (FAQ, comparativos, dados setoriais) que esses modelos tendem a referenciar.

Prioridade pratica: 2 a 3 artigos por mes focados em perguntas reais do seu publico sobre certificacao digital. Cada conteudo bem estruturado tem potencial de adicionar mencoes ao score atual.`;
  }

  // Trafego
  if (isTrafego) {
    return `O trafego organico estimado atual e de ${trafego ? trafego.toLocaleString('pt-BR') : 'N/A'} visitas/mes, com ${keywords ? keywords.toLocaleString('pt-BR') : 'N/A'} keywords posicionadas.

Quedas de trafego geralmente tem 3 causas principais: perda de posicao em keywords disputadas, mudancas no algoritmo do Google afetando paginas especificas, ou reducao de volume de busca sazonal. Para identificar a causa exata, compare as posicoes atuais das suas top 20 keywords com o mes anterior e localize quais URLs perderam mais cliques.

Acao imediata: priorize paginas que caciram do top 3 para posicoes 4-10 — sao as com maior potencial de recuperacao rapida. Atualize o conteudo, reforce o titulo e adicione dados mais recentes.`;
  }

  // Keywords
  if (isKeyword) {
    return `O dominio tem ${keywords ? keywords.toLocaleString('pt-BR') : 'N/A'} keywords organicas posicionadas no top 100. O Authority Score atual e ${authority || 'N/A'}/100.

Para priorizar, foque em dois grupos: (1) keywords nas posicoes 4 a 10, que precisam de um pequeno empurrao para entrar no top 3 e podem dobrar ou triplicar o trafego; (2) keywords com alto CPC e posicao acima de 10, que indicam intencao comercial — vale criar paginas especificas e mais profundas para cada uma.

Acao concreta: escolha as 5 keywords de maior volume nas posicoes 4-10, atualize titulo, H1 e adicione FAQ estruturado nas paginas correspondentes. Resultado esperado em 30 a 60 dias.`;
  }

  // Backlinks / Autoridade
  if (isBacklink) {
    return `O dominio tem ${backlinks ? backlinks.toLocaleString('pt-BR') : 'N/A'} backlinks de ${dominios ? dominios.toLocaleString('pt-BR') : 'N/A'} dominios referenciando. Authority Score: ${authority || 'N/A'}/100.

Para link building no setor de certificacao digital, os canais mais eficientes sao: portais juridicos e de compliance (citando suas paginas sobre validade legal), associacoes do setor (ICP-Brasil, ANICER), e mencoes em noticias sobre LGPD, NFe e assinatura eletronica — contextos onde bry.com.br tem autoridade natural.

Prioridade: 3 a 5 links de qualidade por mes sao suficientes para mover o Authority Score. Foque em dominios acima de 50 de authority e relevancia tematica.`;
  }

  // Trafego pago
  if (isPago) {
    const paginas = [
      '"certificado digital"', '"certificado ICP-Brasil"',
      '"assinatura digital"', '"certificado A1"', '"certificado A3"'
    ];
    return `Para trafego pago, as paginas prioritarias sao aquelas que ja convertem organicamente mas perdem volume por sazonalidade ou concorrencia em ads. Foque nas landing pages ligadas a keywords com alto CPC — isso indica que concorrentes ja pagam caro por esses termos porque convertem.

Termos como ${paginas.slice(0, 3).join(', ')} geralmente tem CPC alto no setor. Crie landing pages especificas por tipo de certificado (A1, A3, por profissao) com formulario de contato acima do fold e depoimentos de clientes.

Teste: campanha de remarketing para quem visitou a pagina de certificado mas nao converteu — custo baixo e taxa de conversao significativamente mais alta que campanhas de prospeccao fria.`;
  }

  // Concorrentes
  if (isCompetidor) {
    return `A analise de concorrentes do dashboard mostra os dominios com maior trafego organico em keywords que voce tambem compete. O foco deve ser identificar conteudos que eles rankeiam bem e que voce ainda nao cobre — sao gaps de conteudo com potencial imediato.

Estrategia pratica: pegue os top 5 concorrentes e filtre as keywords que eles rankeiam nas posicoes 1-3 em que voce esta ausente ou esta abaixo de 10. Crie conteudo mais completo e atual para cada uma dessas keywords, especialmente as com volume acima de 500 buscas/mes.

Diferenciador: no setor de certificacao digital, conteudo tecnico com dados legais atualizados (referencias a MP 2.200-2, ICP-Brasil, legislacoes recentes) tende a superar concorrentes que publicam conteudo generico.`;
  }

  // Resposta generica baseada nos dados disponíveis
  return `Com base nos dados atuais: ${trafego ? trafego.toLocaleString('pt-BR') + ' visitas/mes' : ''}${keywords ? ', ' + keywords.toLocaleString('pt-BR') + ' keywords posicionadas' : ''}${authority ? ' e Authority Score ' + authority + '/100' : ''}.

As tres prioridades praticas para os proximos 30 dias sao: (1) atualizar as paginas que estao nas posicoes 4-10 com maior volume de busca — sao as com maior potencial de subir rapido; (2) publicar 2 conteudos novos focados em perguntas que seu publico faz sobre certificacao digital para ampliar tanto o trafego organico quanto as mencoes em LLMs; (3) buscar 3 a 5 backlinks de portais do setor para fortalecer o Authority Score.

Se quiser uma analise mais especifica, reformule a pergunta mencionando o topico: trafego, keywords, IA/GEO, concorrentes ou backlinks.`;
}

export async function POST(request) {
  try {
    const { question, context } = await request.json();
    if (!question || !context) {
      return NextResponse.json({ answer: 'Pergunta ou contexto ausente.' });
    }
    const answer = gerarResposta(question, context);
    return NextResponse.json({ answer });
  } catch (error) {
    return NextResponse.json({ answer: 'Erro ao processar sua pergunta. Tente novamente.' });
  }
}
