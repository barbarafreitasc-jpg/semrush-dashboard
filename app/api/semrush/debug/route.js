import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain') || 'bry.com.br';
  const database = searchParams.get('database') || 'br';
  const key = process.env.SEMRUSH_API_KEY;
  const results = {};
  // domain_ranks raw
  const u1 = `https://api.semrush.com/?type=domain_ranks&domain=${domain}&database=${database}&export_columns=Db,Dn,Rk,Or,Ot,Oc,Ad,At,Ac&key=${key}`;
  const r1 = await fetch(u1, { cache: 'no-store' });
  results.domain_ranks_raw = await r1.text();
  // domain_organic raw (just 3 rows)
  const u2 = `https://api.semrush.com/?type=domain_organic&domain=${domain}&database=${database}&display_limit=3&display_sort=tr_desc&export_columns=Ph,Po,Nq,Tr,Ai,Fp&key=${key}`;
  const r2 = await fetch(u2, { cache: 'no-store' });
  results.domain_organic_raw = await r2.text();
  // domain_rank_history raw
  const u3 = `https://api.semrush.com/?type=domain_rank_history&domain=${domain}&database=${database}&display_limit=3&export_columns=Dt,Or,Ot,Oc&key=${key}`;
  const r3 = await fetch(u3, { cache: 'no-store' });
  results.domain_rank_history_raw = await r3.text();
  return NextResponse.json(results);
}
