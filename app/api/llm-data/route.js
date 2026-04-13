/**
 * GET /api/llm-data  — retorna dados LLM salvos no servidor
 * POST /api/llm-data — salva dados LLM no servidor
 *
 * Usa dois níveis de persistência:
 *   1) Variável de módulo (memória) — resposta imediata enquanto instância vive
 *   2) /tmp/semrush_llm.json — sobrevive a reinicializações do container na mesma instância
 *
 * Isso garante que qualquer browser que acesse o dashboard veja os dados
 * que foram salvos pelo último usuário — sem depender de localStorage.
 */

import { NextResponse } from 'next/server';
import fs from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TMP_FILE = '/tmp/semrush_llm.json';

// Cache em memória — persiste enquanto a instância serverless estiver quente
let memCache = null;

// Tenta carregar do disco na inicialização do módulo
try {
  if (fs.existsSync(TMP_FILE)) {
    memCache = JSON.parse(fs.readFileSync(TMP_FILE, 'utf8'));
  }
} catch {}

export async function GET() {
  if (memCache) {
    return NextResponse.json(memCache, {
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

    // Garante que syncedAt existe
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
