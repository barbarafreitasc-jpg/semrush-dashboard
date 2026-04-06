/**
 * lib/utils.js
 * Utilitários de formatação e helpers gerais.
 */

import { clsx } from 'clsx';

export function cn(...inputs) {
  return clsx(inputs);
}

/** Formata número grande com sufixo (1200 → 1.2K) */
export function formatNumber(value) {
  if (!value && value !== 0) return '—';
  const n = Number(value);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('pt-BR');
}

/** Formata valor monetário em USD */
export function formatCurrency(value) {
  if (!value && value !== 0) return '—';
  const n = Number(value);
  return new Intl.NumberFormat('pt-BR', {
    style:    'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

/** Formata posição com delta (ex: +2, -3) */
export function formatPositionDelta(current, previous) {
  if (!previous) return null;
  const delta = previous - current; // positivo = subiu
  if (delta === 0) return { value: '=', direction: 'neutral' };
  if (delta > 0)   return { value: `+${delta}`, direction: 'up' };
  return { value: String(delta), direction: 'down' };
}

/** Converte string de trend "v1,v2,...,v12" em array de numbers */
export function parseTrend(trendStr) {
  if (!trendStr) return [];
  return trendStr.split(',').map(Number);
}

/** Formata data no padrão legível (20240101 → Jan 2024) */
export function formatMonthYear(dateStr) {
  if (!dateStr || dateStr.length < 6) return dateStr;
  const year  = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const date  = new Date(`${year}-${month}-01`);
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

/** Cor de badge por posição */
export function positionColor(pos) {
  if (pos <= 3)  return 'text-emerald-400';
  if (pos <= 10) return 'text-blue-400';
  if (pos <= 20) return 'text-yellow-400';
  return 'text-slate-400';
}

/** Score de autoridade: cor conforme valor */
export function ascolorClass(score) {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-red-400';
}
