/**
 * GET /api/llm-data  — retorna dados LLM salvos no servidor
 * POST /api/llm-data — salva dados LLM no servidor
 *
 * Estratégia de persistência (em ordem de confiabilidade):
 *   1) Variável de módulo (memCache) — instantânea enquanto a instância está quente
 *   2) /tmp/semrush_llm.json — persiste enquanto o container da mesma instância vive
 *   3) LLM_SEED_DATA (env var) — fallback estático configurável no Vercel Dashboard
 *      → nunca retorna null: garante dados visíveis mesmo em aba anônima / instância fria
 *
 * IMPORTANTE: Vercel serverless usa múltiplas instâncias em paralelo. Para persistência
 * real entre instâncias configure LLM_SEED_DATA no Vercel Dashboard com o JSON dos dados
 * de referência do domínio. Instâncias frias lerão essa env var e sempre terão dados.
 */

import { NextResponse } from 'next/server';
import fs from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TMP_FILE = '/tmp/semrush_llm.json';

// Cache em memória — persiste enquanto a instância serverless está quente
let memCache = null;

// Tenta carregar do disco na inicialização do módulo
try {
  if (fs.existsSync(TMP_FILE)) {
    memCache = JSON.parse(fs.readFileSync(TMP_FILE, 'utf8'));
  }
} catch {}

// Lê LLM_SEED_DATA da env var (configurado no Vercel Dashboard)
// Esse é o fallback confiável que funciona em qualquer instância / aba anônima
function getSeedData() {
  try {
    const raw = process.env.LLM_SEED_DATA;
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export async function GET() {
  // Ordem de prioridade: memCache → /tmp → LLM_SEED_DATA
  const data = memCache || getSeedData();

  if (data) {
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  return NextResponse.json(null, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    const toSave = { ...data, syncedAt: data.syncedAt || new Date().toISOString() };

    // Salva em memória
    memCache = toSave;

    // Salva em disco (resiliente a falhas)
    try { fs.writeFileSync(TMP_FILE, JSON.stringify(toSave)); } catch {}

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
