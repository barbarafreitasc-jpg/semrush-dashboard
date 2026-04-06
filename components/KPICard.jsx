'use client';

import { cn } from '@/lib/utils';

/**
 * KPICard — Cartão de métrica principal do dashboard.
 * Props:
 *   title     string   — label da métrica
 *   value     string   — valor formatado
 *   subtitle  string   — contexto adicional (opcional)
 *   icon      ReactNode — ícone Lucide
 *   trend     'up' | 'down' | 'neutral' — direção da variação
 *   delta     string   — texto da variação (ex: "+12.3%")
 *   loading   boolean
 *   color     string   — classe de cor do ícone/accent
 */
export default function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  delta,
  loading = false,
  color = 'text-brand-500',
}) {
  const trendColor = trend === 'up'
    ? 'text-emerald-400'
    : trend === 'down'
    ? 'text-red-400'
    : 'text-slate-400';

  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-5 flex flex-col gap-3 hover:border-brand-500/40 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400 font-medium">{title}</span>
        {icon && (
          <span className={cn('opacity-80', color)}>{icon}</span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-8 bg-surface-border rounded w-2/3" />
          <div className="h-4 bg-surface-border rounded w-1/2" />
        </div>
      ) : (
        <>
          <div className="text-3xl font-bold text-white tracking-tight">
            {value ?? '—'}
          </div>

          <div className="flex items-center gap-2 text-sm">
            {delta && (
              <span className={cn('font-semibold', trendColor)}>
                {trendArrow} {delta}
              </span>
            )}
            {subtitle && (
              <span className="text-slate-500">{subtitle}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
