/**
 * lib/semrush.js
 * Cliente server-side para a API do SEMrush.
 *
 * IMPORTANTE: a API do SEMrush retorna os nomes COMPLETOS das colunas no CSV,
 * não os códigos curtos usados em export_columns. Ex: export_columns=Rk
 * retorna a coluna com header "Rank", não "Rk".
 *
 * Este arquivo NUNCA é exposto ao browser.
 */

const API_BASE      = 'https://api.semrush.com';
const API_ANALYTICS = 'https://api.semrush.com/analytics/v1';

// ─── Utilitários de parsing ───────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(';').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(';');
    return headers.reduce((obj, header, i) => {
      obj[header] = values[i]?.trim() ?? '';
      return obj;
    }, {});
  });
}

function buildUrl(base, params) {
  const qs = new URLSearchParams({ key: process.env.SEMRUSH_API_KEY, ...params });
  return `${base}/?${qs.toString()}`;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/**
 * Visão geral do domínio — dados atuais.
 * Colunas retornadas: Database;Domain;Rank;Organic Keywords;Organic Traffic;
 *   Organic Cost;Adwords Keywords;Adwords Traffic;Adwords Cost
 */
export async function getDomainOverview(domain, database = 'br') {
  const url = buildUrl(API_BASE, {
    type:           'domain_ranks',
    domain,
    database,
    export_columns: 'Db,Dn,Rk,Or,Ot,Oc,Ad,At,Ac',
  });

  const res  = await fetch(url, { cache: 'no-store' });
  const text = await res.text();

  if (text.startsWith('ERROR')) {
    const parts = text.split('::').map(s => s.trim());
    throw new Error(`[SEMrush domain_ranks] Erro ${parts[1] ?? ''}: ${parts[2] ?? text}`);
  }

  const rows = parseCSV(text);
  if (!rows.length) return null;

  const row = rows[0];
  return {
    domain:          row['Domain']           || domain,
    rank:            Number(row['Rank'])                || 0,
    organicKeywords: Number(row['Organic Keywords'])    || 0,
    organicTraffic:  Number(row['Organic Traffic'])     || 0,
    organicCost:     Number(row['Organic Cost'])        || 0,
    paidKeywords:    Number(row['Adwords Keywords'])    || 0,
    paidTraffic:     Number(row['Adwords Traffic'])     || 0,
    paidCost:        Number(row['Adwords Cost'])        || 0,
  };
}

/**
 * Histórico de tráfego orgânico — últimos 24 meses.
 * Colunas: Date;Organic Keywords;Organic Traffic;Organic Cost
 */
export async function getTrafficHistory(domain, database = 'br') {
  const url = buildUrl(API_BASE, {
    type:           'domain_rank_history',
    domain,
    database,
    display_limit:  24,
    export_columns: 'Dt,Or,Ot,Oc',
  });

  const res  = await fetch(url, { cache: 'no-store' });
  const text = await res.text();

  // Histórico pode não estar disponível em planos básicos
  if (text.startsWith('ERROR')) return [];

  return parseCSV(text).map(row => ({
    date:     row['Date'],
    keywords: Number(row['Organic Keywords']) || 0,
    traffic:  Number(row['Organic Traffic'])  || 0,
    cost:     Number(row['Organic Cost'])     || 0,
  }));
}

/**
 * Top keywords orgânicas do domínio.
 * Colunas: Keyword;Position;Previous Position;Search Volume;CPC;Url;
 *   Traffic (%);Traffic Cost (%);Competition;Number of Results;Trends
 */
export async function getOrganicKeywords(domain, database = 'br', limit = 50) {
  const url = buildUrl(API_BASE, {
    type:           'domain_organic',
    domain,
    database,
    display_limit:  limit,
    display_sort:   'tr_desc',
    export_columns: 'Ph,Po,Pp,Nq,Cp,Ur,Tr,Tc,Co,Nr,Td',
  });

  const res  = await fetch(url, { cache: 'no-store' });
  const text = await res.text();

  if (text.startsWith('ERROR')) {
    const parts = text.split('::').map(s => s.trim());
    throw new Error(`[SEMrush domain_organic] Erro ${parts[1] ?? ''}: ${parts[2] ?? text}`);
  }

  return parseCSV(text)
    .filter(row => (row['Keyword'] ?? '').length > 0)
    .map(row => ({
      keyword:      row['Keyword'],
      position:     Number(row['Position'])          || 0,
      prevPosition: Number(row['Previous Position']) || 0,
      volume:       Number(row['Search Volume'])     || 0,
      cpc:          Number(row['CPC'])               || 0,
      url:          row['Url'],
      trafficShare: Number(row['Traffic (%)'])       || 0,
      competition:  Number(row['Competition'])       || 0,
      results:      Number(row['Number of Results']) || 0,
      trend:        row['Trends'],
    }));
}

/**
 * Principais concorrentes orgânicos.
 * Colunas: Domain;Competitor Relevance;Common Keywords;
 *   Organic Keywords;Organic Traffic;Organic Cost;Adwords Keywords
 */
export async function getCompetitors(domain, database = 'br', limit = 10) {
  const url = buildUrl(API_BASE, {
    type:           'domain_organic_organic',
    domain,
    database,
    display_limit:  limit,
    export_columns: 'Dn,Cr,Np,Or,Ot,Oc,Ad',
  });

  const res  = await fetch(url, { cache: 'no-store' });
  const text = await res.text();

  if (text.startsWith('ERROR')) return [];

  return parseCSV(text)
    .filter(row => (row['Domain'] ?? '').length > 0)
    .map(row => ({
      domain:          row['Domain'],
      relevance:       Number(row['Competitor Relevance']) || 0,
      commonKeywords:  Number(row['Common Keywords'])      || 0,
      organicKeywords: Number(row['Organic Keywords'])     || 0,
      organicTraffic:  Number(row['Organic Traffic'])      || 0,
      organicCost:     Number(row['Organic Cost'])         || 0,
      paidKeywords:    Number(row['Adwords Keywords'])     || 0,
    }));
}

/**
 * Visão geral de backlinks.
 * Colunas: ascore;total;domains_num;urls_num;ips_num;follows_num;...
 * (a API de analytics retorna esses nomes em lowercase — únicos que já funcionavam)
 */
export async function getBacklinksOverview(domain) {
  const qs = new URLSearchParams({
    key:            process.env.SEMRUSH_API_KEY,
    type:           'backlinks_overview',
    target:         domain,
    target_type:    'root_domain',
    export_columns: 'ascore,total,domains_num,urls_num,ips_num,follows_num,nofollows_num,texts_num,images_num',
  });

  const res  = await fetch(`${API_ANALYTICS}/?${qs}`, { cache: 'no-store' });
  const text = await res.text();

  if (text.startsWith('ERROR')) {
    const parts = text.split('::').map(s => s.trim());
    throw new Error(`[SEMrush backlinks_overview] Erro ${parts[1] ?? ''}: ${parts[2] ?? text}`);
  }

  const rows = parseCSV(text);
  if (!rows.length) return null;

  const row = rows[0];
  return {
    authorityScore:   Number(row['ascore'])       || 0,
    total:            Number(row['total'])         || 0,
    referringDomains: Number(row['domains_num'])   || 0,
    referringUrls:    Number(row['urls_num'])      || 0,
    referringIPs:     Number(row['ips_num'])       || 0,
    dofollow:         Number(row['follows_num'])   || 0,
    nofollow:         Number(row['nofollows_num']) || 0,
    textLinks:        Number(row['texts_num'])     || 0,
    imageLinks:       Number(row['images_num'])    || 0,
  };
}

/**
 * Top backlinks novos recentemente.
 */
export async function getBacklinksNew(domain, limit = 20) {
  const qs = new URLSearchParams({
    key:            process.env.SEMRUSH_API_KEY,
    type:           'backlinks_new_lost',
    target:         domain,
    target_type:    'root_domain',
    new_lost:       'new',
    display_limit:  limit,
    export_columns: 'source_url,target_url,anchor,external_num,internal_num,ascore,response_code,nofollow,form,image,frame,redirect',
  });

  const res  = await fetch(`${API_ANALYTICS}/?${qs}`, { cache: 'no-store' });
  const text = await res.text();

  if (text.startsWith('ERROR')) return [];

  return parseCSV(text).map(row => ({
    sourceUrl: row['source_url'],
    targetUrl: row['target_url'],
    anchor:    row['anchor'],
    ascore:    Number(row['ascore']) || 0,
    nofollow:  row['nofollow'] === '1',
  }));
}

/**
 * Dados de SERP Features + visibilidade em IA.
 *
 * A coluna 'Ai' (AI Overview) NÃO está disponível neste plano.
 * Usamos a coluna 'Fp' (SERP Features by Position) para detectar
 * quantas keywords têm recursos especiais de SERP (Featured Snippets, etc.).
 *
 * Coluna Fp: número inteiro que representa o código da feature SERP:
 *   1=Instant Answer, 2=Knowledge Box, 4=Featured Snippet, 8=Image Pack,
 *   16=News Box, 32=Local Pack, etc.
 *
 * Para AI Overview (Google AIO), o código é 22 no SEMrush.
 * Se o valor Fp contém 22 em qualquer posição, a keyword aparece em AIO.
 */
export async function getAIVisibilityData(domain, database = 'br') {
  const url = buildUrl(API_BASE, {
    type:           'domain_organic',
    domain,
    database,
    display_limit:  100,
    display_sort:   'tr_desc',
    export_columns: 'Ph,Po,Nq,Tr,Fp',
  });

  const res  = await fetch(url, { cache: 'no-store' });
  const text = await res.text();

  if (text.startsWith('ERROR')) {
    const parts = text.split('::').map(s => s.trim());
    throw new Error(`[SEMrush ai_visibility] Erro ${parts[1] ?? ''}: ${parts[2] ?? text}`);
  }

  const rows = parseCSV(text).filter(r => (r['Keyword'] ?? '').length > 0);

  // 'SERP Features by Position' = campo Fp — valor numérico de feature code
  // Detectar keywords com qualquer SERP feature (Fp > 0)
  const withFeatures = rows.filter(r => Number(r['SERP Features by Position'] ?? r['Fp'] ?? 0) > 0);

  // Featured Snippet = código 4 (bit 2)
  const withFeaturedSnippet = rows.filter(r => {
    const fp = Number(r['SERP Features by Position'] ?? r['Fp'] ?? 0);
    return fp > 0 && (fp & 4) === 4;
  });

  // AI Overview = código 22 no SEMrush (verificar presença na string de features)
  const serpCol = rows[0] ? Object.keys(rows[0]).find(k => k.toLowerCase().includes('serp') || k === 'Fp') : null;
  const withAIOverview = rows.filter(r => {
    const fp = r[serpCol] ?? '';
    // Valor 22 presente na lista de features (pode ser comma-separated em alguns planos)
    return fp === '22' || fp.split(',').includes('22');
  });

  const totalTraffic = rows.reduce((s, r) => s + (Number(r['Traffic (%)']) || 0), 0);
  const featureTraffic = withFeatures.reduce((s, r) => s + (Number(r['Traffic (%)']) || 0), 0);

  return {
    totalKeywordsAnalyzed: rows.length,
    aiKeywords:            withAIOverview.length,
    featuredSnippets:      withFeaturedSnippet.length,
    keywordsWithFeatures:  withFeatures.length,
    visibilityScore:       rows.length > 0 ? Math.round((withFeatures.length / rows.length) * 100) : 0,
    aiTrafficPct:          0, // sem dados diretos de AI Overview neste plano
    aiTotalTraffic:        0,
    topAIKeywords: [], // vazio quando Ai não disponível
    topFeaturedSnippets: withFeaturedSnippet.slice(0, 10).map(r => ({
      keyword:      r['Keyword'],
      position:     Number(r['Position']) || 0,
      volume:       Number(r['Search Volume']) || 0,
      trafficShare: Number(r['Traffic (%)']) || 0,
    })),
    topKeywords: rows.slice(0, 10).map(r => ({
      keyword:      r['Keyword'],
      position:     Number(r['Position']) || 0,
      volume:       Number(r['Search Volume']) || 0,
      trafficShare: Number(r['Traffic (%)']) || 0,
      features:     r[serpCol] ?? '',
    })),
    planNote: 'AI Overview direto requer plano Business do SEMrush. Dados de SERP Features disponíveis.',
  };
}
