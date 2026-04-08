import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function raw(url) {
  const r = await fetch(url, { cache: 'no-store' });
  return r.text();
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain') || 'bry.com.br';
  const db = searchParams.get('database') || 'br';
  const k = process.env.SEMRUSH_API_KEY;
  const b = 'https://api.semrush.com';
  const a = 'https://api.semrush.com/analytics/v1';

  const [r1,r2,r3,r4,r5] = await Promise.all([
    raw(`${b}/?type=domain_ranks&domain=${domain}&database=${db}&export_columns=Db,Dn,Rk,Or,Ot,Oc,Ad,At,Ac&key=${k}`),
    raw(`${b}/?type=domain_organic&domain=${domain}&database=${db}&display_limit=2&display_sort=tr_desc&export_columns=Ph,Po,Pp,Nq,Cp,Ur,Tr,Tc,Co,Nr,Td&key=${k}`),
    raw(`${b}/?type=domain_rank_history&domain=${domain}&database=${db}&display_limit=3&export_columns=Dt,Or,Ot,Oc&key=${k}`),
    raw(`${b}/?type=domain_organic_organic&domain=${domain}&database=${db}&display_limit=3&export_columns=Dn,Cr,Np,Or,Ot,Oc,Ad&key=${k}`),
    raw(`${a}/?type=backlinks_overview&target=${domain}&target_type=root_domain&export_columns=ascore,total,domains_num,urls_num,ips_num,follows_num,nofollows_num,texts_num,images_num&key=${k}`),
  ]);

  const headers = (txt) => txt?.split(/\r?\n/)[0] || '';
  const first   = (txt) => txt?.split(/\r?\n/).slice(0,3).join(' | ') || '';

  return NextResponse.json({
    domain_ranks:          { headers: headers(r1), sample: first(r1) },
    domain_organic:        { headers: headers(r2), sample: first(r2) },
    domain_rank_history:   { headers: headers(r3), sample: first(r3) },
    competitors:           { headers: headers(r4), sample: first(r4) },
    backlinks:             { headers: headers(r5), sample: first(r5) },
  });
}
