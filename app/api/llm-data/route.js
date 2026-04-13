/**
 * GET /api/llm-data  â retorna dados LLM salvos no servidor
 * POST /api/llm-data â salva dados LLM no servidor
 *
 * EstratÃ©gia de persistÃªncia (em ordem de confiabilidade):
 *   1) VariÃ¡vel de mÃ³dulo (memCache) â instantÃ¢nea enquanto a instÃ¢ncia estÃ¡ quente
 *   2) /tmp/semrush_llm.json â persiste enquanto o container da mesma instÃ¢ncia vive
 *   3) LLM_SEED_DATA (env var) â fallback estÃ¡tico configurÃ¡vel no Vercel Dashboard
 *      â nunca retorna null: garante dados visÃ­veis mesmo em aba anÃ´nima / instÃ¢ncia fria
 *
 * IMPORTANTE: Vercel serverless usa mÃºltiplas instÃ¢ncias em paralelo. Para persistÃªncia
 * real entre instÃ¢ncias configure LLM_SEED_DATA no Vercel Dashboard com o JSON dos dados
 * de referÃªncia do domÃ­nio. InstÃ¢ncias frias lerÃ£o essa env var e sempre terÃ£o dados.
 */

import { NextResponse } from 'next/server';
import fs from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TMP_FILE = '/tmp/semrush_llm.json';

// Cache em memÃ³ria â persiste enquanto a instÃ¢ncia serverless estÃ¡ quente
let memCache = null;

// Tenta carregar do disco na inicializaÃ§Ã£o do mÃ³dulo
try {
  if (fs.existsSync(TMP_FILE)) {
    memCache = JSON.parse(fs.readFileSync(TMP_FILE, 'utf8'));
  }
} catch {}

// Le LLMWÔÑQQÑUHH[\
ÛÛYÝ\YÈÈ\Ù[\ÚØ\
BËÈ\ÜÙH0êHÈ[XÚÈÛÛYÝ\°è][]YH[Ú[ÛH[H]X[]Y\[Ý0èÚXHÈXH[°í[XB[Ý[ÛÙ]ÙYY]J
HÂHÂÛÛÝ]ÈHØÙ\ÜË[WÔÑQQÑUNÂY
]ÊH]\ÓÓ\ÙJ]ÊNÂHØ]ÚßB]\[ÂB^Ü\Þ[È[Ý[ÛÑU

HÂËÈÜ[HH[ÜYYNY[PØXÚH8¡¤Ý\8¡¤WÔÑQQÑUBÛÛÝ]HHY[PØXÚHÙ]ÙYY]J
NÂY
]JHÂ]\^\ÜÛÙKÛÛ]KÂXY\ÎÈ	ÐØXÚKPÛÛÛ	Î	ÛË\ÝÜIÈKJNÂB]\^\ÜÛÙKÛÛ[ÂXY\ÎÈ	ÐØXÚKPÛÛÛ	Î	ÛË\ÝÜIÈKJNÂB^Ü\Þ[È[Ý[ÛÔÕ
\]Y\Ý
HÂHÂÛÛÝ]HH]ØZ]\]Y\ÝÛÛ
NÂY
Y]H\[Ù]HOOH	ÛØXÝ	ÊHÂ]\^\ÜÛÙKÛÛÈ\Ü	ÑYÜÈ[°è[YÜËÈKÈÝ]\Î
JNÂBÛÛÝÔØ]HHÈ]KÞ[ÙY]]KÞ[ÙY]]È]J
KÒTÓÔÝ[Ê
HNÂËÈØ[H[HY[pìÜXBY[PØXÚHHÔØ]NÂËÈØ[H[H\ØÛÈ
\Ú[Y[HH[\ÊBHÈËÜ]Q[TÞ[ÊTÑSKÓÓÝ[ÚYJÔØ]JJNÈHØ]ÚßB]\^\ÜÛÙKÛÛÈÚÎYHJNÂHØ]Ú
\HÂ]\^\ÜÛÙKÛÛÈ\Ü\Y\ÜØYÙHKÈÝ]\Î
LJNÂBB
