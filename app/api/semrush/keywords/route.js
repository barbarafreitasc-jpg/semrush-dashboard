/**
 * GET /api/semrush/keywords?domain=seusite.com&database=br&limit=50&date=YYYYMM01
 * Retorna top palavras-chave orgânicas do domínio.
 */

import { NextResponse } from 'next/server';
import { getOrganicKeywords } from '@/lib/semrush';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const domain      = searchParams.get('domain')?.toLowerCase().trim();
  const database    = searchParams.get('database') || 'br';
  const limit       = Math.min(Number(searchParams.get('limit') || 50), 100);
  const displayDate = searchParams.get('date') || null;

  if (!domain) {
    return NextResponse.json({ error: 'Parâmetro "domain" é obrigatório.' }, { status: 400 });
  }

  try {
    const keywords = await getOrganicKeywords(domain, database, limit, displayDate);
    return NextResponse.json(
      { keywords, total: keywords.length, fetchedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('[/api/semrush/keywords]', err.message);
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
