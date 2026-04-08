/**
 * GET /api/semrush/ai-visibility?domain=seusite.com&database=br
 * Retorna dados de visibilidade em IA (Google AI Overviews) para o domínio.
 */

import { NextResponse } from 'next/server';
import { getAIVisibilityData } from '@/lib/semrush';

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
    const data = await getAIVisibilityData(domain, database);
    return NextResponse.json(
      { ...data, fetchedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('[/api/semrush/ai-visibility]', err.message);
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
