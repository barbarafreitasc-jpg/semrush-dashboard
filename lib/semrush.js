/**
 * lib/semrush.js
 * Cliente server-side para a API do SEMrush.
 * Este arquivo NUNCA é exposto ao browser — roda apenas nas API Routes do Next.js.
 */

const API_BASE      = 'https://api.semrush.com';
const API_ANALYTICS = 'https://api.semrush.com/analytics/v1';

// ─── Utilitários de parsing ───────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split('\n');
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

function assertNotError(text, context) {
  if (text.startsWith('ERROR')) {
    const parts = text.split('::').map(s => s.trim());
    const code   = parts[1] ?? 'UNKNOWN';
    const msg    = parts[2] ?? text;
    throw new Error(`[SEMrush ${context}] Erro ${code}: ${msg}`);
  }
}

function buildUrl(base, params) {
  const qs = new URLSearchParams({ key: process.env.SEMRUSH_API_KEY, ...params });
  return `${base}/?${qs.toString()}`;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/**
 * Visão geral do domínio — dados atuais (sem filtro de data histórico).
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
  assertNotError(text, 'domain_ranks');

  const rows = parseCSV(text);
  if (!rows.length) return null;

  const row = rows[0];
  return {
    domain:          row['Dn']  || domain,
    rank:            Number(row['Rk'])  || 0,
    organicKeywords: Number(row['Or'])  || 0,
    organicTraffic:  Number(row['Ot'])  || 0,
    organicCost:     Number(row['Oc'])  || 0,
    paidKeywords:    Number(row['Ad'])  || 0,
    paidTraffic:     Number(row['At'])  || 0,
    paidCost:        Number(row['Ac'])  || 0,
  };
}

/**
 * Histórico de tráfego orgânico — tenta buscar histórico; se o plano não
 * suportar (403), retorna array vazio para não quebrar o gráfico.
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

  // Plano free não tem histórico — retorna vazio sem quebrar o dashboard
  if (text.startsWith('ERROR')) return [];

  return parseCSV(text).map(row => ({
    date:     row['Dt'],
    keywords: Number(row['Or']) || 0,
    traffic:  Number(row['Ot']) || 0,
    cost:     Number(row['Oc']) || 0,
  }));
}

/**
 * Top palavras-chave orgânicas do domínio — dados atuais.
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
  assertNotError(text, 'domain_organic');

  return parseCSV(text)
    .filter(row => (row['Ph'] ?? '').length > 0)
    .map(row => ({
      keyword:      row['Ph'],
      position:     Number(row['Po'])  || 0,
      prevPosition: Number(row['Pp'])  || 0,
      volume:       Number(row['Nq'])  || 0,
      cpc:          Number(row['Cp'])  || 0,
      url:          row['Ur'],
      trafficShare: Number(row['Tr'])  || 0,
      competition:  Number(row['Co'])  || 0,
      results:      Number(row['Nr'])  || 0,
      trend:        row['Td'],
    }));
}

/**
 * Principais concorrentes orgânicos — dados atuais.
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

  // Sem erro fatal — retorna vazio se não houver concorrentes
  if (text.startsWith('ERROR')) return [];

  return parseCSV(text)
    .filter(row => (row['Dn'] ?? '').length > 0)
    .map(row => ({
      domain:          row['Dn'],
      commonKeywords:  Number(row['Cr'])  || 0,
      totalKeywords:   Number(row['Np'])  || 0,
      organicKeywords: Number(row['Or'])  || 0,
      organicTraffic:  Number(row['Ot'])  || 0,
      organicCost:     Number(row['Oc'])  || 0,
      paidKeywords:    Number(row['Ad'])  || 0,
    }));
}

/**
 * Visão geral de backlinks (sempre dado atual).
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
  assertNotError(text, 'backlinks_overview');

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
 * Dados de Visibilidade em IA (Google AI Overviews).
 * Usa domain_organic com coluna 'Ai' para identificar keywords em AI Overview.
 */
export async function getAIVisibilityData(domain, database = 'br') {
  const url = buildUrl(API_BASE, {
    type:           'domain_organic',
    domain,
    database,
    display_limit:  100,
    display_sort:   'tr_desc',
    export_columns: 'Ph,Po,Nq,Tr,Ur,Ai,Fp',
  });

  const res  = await fetch(url, { cache: 'no-store' });
  const text = await res.text();
  assertNotError(text, 'domain_organic_ai');

  const rows = parseCSV(text).filter(r => (r['Ph'] ?? '').length > 0);

  const withAI       = rows.filter(r => r['Ai'] === '1');
  const withFeatured = rows.filter(r => r['Fp'] === '1');

  const totalTraffic = rows.reduce((sum, r) => sum + (Number(r['Tr']) || 0), 0);
  const aiTraffic    = withAI.reduce((sum, r) => sum + (Number(r['Tr']) || 0), 0);

  const aiTrafficPct = totalTraffic > 0
    ? Math.round((aiTraffic / totalTraffic) * 100)
    : 0;

  const visibilityScore = rows.length > 0
    ? Math.round((withAI.length / rows.length) * 100)
    : 0;

  return {
    totalKeywordsAnalyzed: rows.length,
    aiKeywords:            withAI.length,
    featuredSnippets:      withFeatured.length,
    visibilityScore,
    aiTrafficPct,
    aiTotalTraffic:        aiTraffic,
    topAIKeywords: withAI.slice(0, 20).map(r => ({
      keyword:      r['Ph'],
      position:     Number(r['Po'])  || 0,
      volume:       Number(r['Nq'])  || 0,
      trafficShare: Number(r['Tr'])  || 0,
      url:          r['Ur'],
    })),
  };
}
