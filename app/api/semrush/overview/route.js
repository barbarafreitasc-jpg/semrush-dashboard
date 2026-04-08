/**
 * GET /api/semrush/overview?domain=seusite.com&database=br
 * Retorna visão geral do domínio: tráfego, keywords, custo, histórico.
 */

import { NextResponse } from 'next/server';
import { getDomainOverview, getTrafficHistory } from '@/lib/semrush';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const domain   = searchParams.get('domain')?.toLowerCase().trim();
  const database = searchParams.get('database') || 'br';

  if (!domain) {
    return NextResponse.json({ error: 'Parâmetro "domain" é obrigatório.' }, { status: 400 });
  }

  if (!process.env.SEMRUSH_API_KEY) {
    return NextResponse.json(
      { error: 'SEMRUSH_API_KEY não configurada no servidor.' },
      { status: 500 }
    );
  }

  try {
    const [overview, history] = await Promise.all([
      getDomainOverview(domain, database),
      getTrafficHistory(domain, database),
    ]);

    return NextResponse.json(
      { overview, history, fetchedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('[/api/semrush/overview]', err.message);
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
