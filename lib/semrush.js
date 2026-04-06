/**
 * lib/semrush.js
 * Cliente server-side para a API do SEMrush.
 * Este arquivo NUNCA é exposto ao browser — roda apenas nas API Routes do Next.js.
 */

const API_BASE      = 'https://api.semrush.com';
const API_ANALYTICS = 'https://api.semrush.com/analytics/v1';

// ─── Utilitários de parsing ───────────────────────────────────────────────────

/**
 * Converte a resposta CSV semicolon-separated do SEMrush em array de objetos.
 */
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

/**
 * Checa se a resposta da API é um erro e lança exceção com mensagem clara.
 */
function assertNotError(text, context) {
  if (text.startsWith('ERROR')) {
    // Formato: ERROR :: <code> :: <message>
    const parts = text.split('::').map(s => s.trim());
    const code   = parts[1] ?? 'UNKNOWN';
    const msg    = parts[2] ?? text;
    throw new Error(`[SEMrush ${context}] Erro ${code}: ${msg}`);
  }
}

// ─── Construção de URL com parâmetros ─────────────────────────────────────────

function buildUrl(base, params) {
  const qs = new URLSearchParams({ key: process.env.SEMRUSH_API_KEY, ...params });
  return `${base}/?${qs.toString()}`;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/**
 * Visão geral do domínio: tráfego, keywords, custo.
 * Docs: https://developer.semrush.com/api/v3/analytics/domain-reports/#domain-overview-all-databases
 */
export async function getDomainOverview(domain, database = 'br') {
  const url = buildUrl(API_BASE, {
    type:           'domain_ranks',
    domain,
    database,
    export_columns: 'Db,Dn,Rk,Or,Ot,Oc,Ad,At,Ac',
  });

  const res  = await fetch(url, { next: { revalidate: 300 } });
  const text = await res.text();
  assertNotError(text, 'domain_ranks');

  const rows = parseCSV(text);
  if (!rows.length) return null;

  const row = rows[0];
  return {
    domain:           row['Dn']  || domain,
    rank:             Number(row['Rk'])  || 0,
    organicKeywords:  Number(row['Or'])  || 0,
    organicTraffic:   Number(row['Ot'])  || 0,
    organicCost:      Number(row['Oc'])  || 0,
    paidKeywords:     Number(row['Ad'])  || 0,
    paidTraffic:      Number(row['At'])  || 0,
    paidCost:         Number(row['Ac'])  || 0,
  };
}

/**
 * Histórico de tráfego orgânico (últimos 12 meses).
 */
export async function getTrafficHistory(domain, database = 'br') {
  const url = buildUrl(API_BASE, {
    type:           'domain_rank_history',
    domain,
    database,
    display_limit:  12,
    export_columns: 'Dt,Or,Ot,Oc',
  });

  const res  = await fetch(url, { next: { revalidate: 300 } });
  const text = await res.text();
  assertNotError(text, 'domain_rank_history');

  return parseCSV(text).map(row => ({
    date:     row['Dt'],
    keywords: Number(row['Or']) || 0,
    traffic:  Number(row['Ot']) || 0,
    cost:     Number(row['Oc']) || 0,
  }));
}

/**
 * Top 50 palavras-chave orgânicas do domínio.
 */
export async function getOrganicKeywords(domain, database = 'br', limit = 50) {
  const url = buildUrl(API_BASE, {
    type:           'domain_organic',
    domain,
    database,
    display_limit:  limit,
    display_sort:   'tr_desc',      // ordena por tráfego decrescente
    export_columns: 'Ph,Po,Pp,Nq,Cp,Ur,Tr,Tc,Co,Nr,Td',
  });

  const res  = await fetch(url, { next: { revalidate: 300 } });
  const text = await res.text();
  assertNotError(text, 'domain_organic');

  return parseCSV(text).map(row => ({
    keyword:      row['Ph'],
    position:     Number(row['Po'])  || 0,
    prevPosition: Number(row['Pp'])  || 0,
    volume:       Number(row['Nq'])  || 0,
    cpc:          Number(row['Cp'])  || 0,
    url:          row['Ur'],
    trafficShare: Number(row['Tr'])  || 0,
    competition:  Number(row['Co'])  || 0,
    results:      Number(row['Nr'])  || 0,
    trend:        row['Td'],          // "volume1,volume2,...,volume12" (últimos 12 meses)
  }));
}

/**
 * Principais concorrentes orgânicos.
 */
export async function getCompetitors(domain, database = 'br', limit = 10) {
  const url = buildUrl(API_BASE, {
    type:           'domain_organic_organic',
    domain,
    database,
    display_limit:  limit,
    export_columns: 'Dn,Cr,Np,Or,Ot,Oc,Ad',
  });

  const res  = await fetch(url, { next: { revalidate: 300 } });
  const text = await res.text();
  assertNotError(text, 'domain_organic_organic');

  return parseCSV(text).map(row => ({
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
 * Visão geral de backlinks do domínio.
 * Usa a Analytics API v1 (retorna JSON).
 */
export async function getBacklinksOverview(domain) {
  const qs  = new URLSearchParams({
    key:         process.env.SEMRUSH_API_KEY,
    type:        'backlinks_overview',
    target:      domain,
    target_type: 'root_domain',
    export_columns: 'ascore,total,domains_num,urls_num,ips_num,follows_num,nofollows_num,texts_num,images_num',
  });

  const res  = await fetch(`${API_ANALYTICS}/?${qs}`, { next: { revalidate: 300 } });
  const text = await res.text();
  assertNotError(text, 'backlinks_overview');

  // Esta endpoint retorna CSV também
  const rows = parseCSV(text);
  if (!rows.length) return null;

  const row = rows[0];
  return {
    authorityScore:  Number(row['ascore'])      || 0,
    total:           Number(row['total'])        || 0,
    referringDomains:Number(row['domains_num']) || 0,
    referringUrls:   Number(row['urls_num'])    || 0,
    referringIPs:    Number(row['ips_num'])     || 0,
    dofollow:        Number(row['follows_num']) || 0,
    nofollow:        Number(row['nofollows_num']) || 0,
    textLinks:       Number(row['texts_num'])   || 0,
    imageLinks:      Number(row['images_num'])  || 0,
  };
}

/**
 * Top backlinks novos e perdidos recentemente.
 */
export async function getBacklinksNew(domain, limit = 20) {
  const qs = new URLSearchParams({
    key:         process.env.SEMRUSH_API_KEY,
    type:        'backlinks_new_lost',
    target:      domain,
    target_type: 'root_domain',
    new_lost:    'new',
    display_limit: limit,
    export_columns: 'source_url,target_url,anchor,external_num,internal_num,ascore,response_code,nofollow,form,image,frame,redirect',
  });

  const res  = await fetch(`${API_ANALYTICS}/?${qs}`, { next: { revalidate: 300 } });
  const text = await res.text();
  assertNotError(text, 'backlinks_new_lost');

  return parseCSV(text).map(row => ({
    sourceUrl:   row['source_url'],
    targetUrl:   row['target_url'],
    anchor:      row['anchor'],
    ascore:      Number(row['ascore']) || 0,
    nofollow:    row['nofollow'] === '1',
  }));
}
