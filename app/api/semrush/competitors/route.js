/**
 * GET /api/semrush/competitors?domain=seusite.com&database=br&limit=10
 * Retorna principais concorrentes orgânicos.
 */

import { NextResponse } from 'next/server';
import { getCompetitors } from '@/lib/semrush';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const domain   = searchParams.get('domain')?.toLowerCase().trim();
  const database = searchParams.get('database') || 'br';
  const limit    = Math.min(Number(searchParams.get('limit') || 10), 20);

  if (!domain) {
    return NextResponse.json({ error: 'Parâmetro "domain" é obrigatório.' }, { status: 400 });
  }

  try {
    const competitors = await getCompetitors(domain, database, limit);
    return NextResponse.json(
      { competitors, fetchedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('[/api/semrush/competitors]', err.message);
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
