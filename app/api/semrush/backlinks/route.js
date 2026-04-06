/**
 * GET /api/semrush/backlinks?domain=seusite.com
 * Retorna visão geral de backlinks e links novos.
 */

import { NextResponse } from 'next/server';
import { getBacklinksOverview, getBacklinksNew } from '@/lib/semrush';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain')?.toLowerCase().trim();

  if (!domain) {
    return NextResponse.json({ error: 'Parâmetro "domain" é obrigatório.' }, { status: 400 });
  }

  try {
    const [overview, newLinks] = await Promise.all([
      getBacklinksOverview(domain),
      getBacklinksNew(domain, 20),
    ]);

    return NextResponse.json(
      { overview, newLinks, fetchedAt: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (err) {
    console.error('[/api/semrush/backlinks]', err.message);
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
