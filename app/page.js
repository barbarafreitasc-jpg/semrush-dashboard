'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import {
  Globe,
  TrendingUp,
  Key,
  Users,
  RefreshCw,
  Search,
  AlertCircle,
  Clock,
  Calendar,
} from 'lucide-react';

import KPICard          from '@/components/KPICard';
import TrafficChart     from '@/components/TrafficChart';
import KeywordsTable    from '@/components/KeywordsTable';
import CompetitorsChart from '@/components/CompetitorsChart';
import BacklinksPanel   from '@/components/BacklinksPanel';
import AIVisibilityCard from '@/components/AIVisibilityCard';
import { formatNumber, formatCurrency } from '@/lib/utils';

// ─── Fetcher padrão para SWR ──────────────────────────────────────────────────

const fetcher = url => fetch(url).then(r => {
  if (!r.ok) return r.json().then(e => Promise.reject(e));
  return r.json();
});

// ─── Gera lista de meses (últimos 24) ─────────────────────────────────────────

function generateMonths() {
  const list = [{ value: 'current', label: 'Dados atuais' }];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    // SEMrush history dates são YYYYMM15
    list.push({
      value: `${y}${m}15`,
      label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    });
  }
  return list;
}

const MONTHS = generateMonths();

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ domain, lastUpdate, onRefresh, refreshing }) {
  return (
    <header className="border-b border-surface-border bg-surface-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <TrendingUp size={14} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm hidden sm:block">SEMrush Dashboard</span>
        </div>
        {domain && (
          <div className="flex items-center gap-1.5 bg-surface-border rounded-lg px-3 py-1.5 text-sm text-slate-300 font-medium ml-2">
            <Globe size={12} className="text-brand-500" />
            {domain}
          </div>
        )}
        <div className="ml-auto flex items-center gap-3">
          {lastUpdate && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500">
              <Clock size={10} />
              <span>{new Date(lastUpdate).toLocaleTimeString('pt-BR')}</span>
            </div>
          )}
          {domain && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              title="Forçar atualização"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-border transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Barra de filtro de período ───────────────────────────────────────────────

function PeriodBar({ value, onChange }) {
  return (
    <div className="bg-surface-card/60 border-b border-surface-border backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3">
        <Calendar size={12} className="text-brand-500 shrink-0" />
        <span className="text-xs text-slate-400 font-medium shrink-0">Período:</span>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="bg-surface-border border border-surface-border/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-brand-500 focus:outline-none appearance-none cursor-pointer"
        >
          {MONTHS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        {value !== 'current' && (
          <span className="text-[10px] text-amber-500/80 hidden sm:block">
            Tráfego e keywords refletem o histórico do período · Keywords e concorrentes mostram dados atuais
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Formulário de busca ──────────────────────────────────────────────────────

const DATABASES = [
  { value: 'br', label: '🇧🇷 Brasil (br)' },
  { value: 'us', label: '🇺🇸 EUA (us)' },
  { value: 'uk', label: '🇬🇧 UK (uk)' },
  { value: 'es', label: '🇪🇸 Espanha (es)' },
  { value: 'de', label: '🇩🇪 Alemanha (de)' },
];

const INTERVALS = [
  { value: 60_000,    label: '1 minuto' },
  { value: 300_000,   label: '5 minutos' },
  { value: 900_000,   label: '15 minutos' },
  { value: 1_800_000, label: '30 minutos' },
  { value: 0,         label: 'Manual' },
];

function SearchForm({ onSubmit }) {
  const [input,    setInput]    = useState(process.env.NEXT_PUBLIC_DEFAULT_DOMAIN || '');
  const [database, setDatabase] = useState(process.env.NEXT_PUBLIC_DEFAULT_DATABASE || 'br');
  const [interval, setInterval] = useState(300_000);

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = input.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
    if (clean) onSubmit(clean, database, interval);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SEMrush Dashboard</h1>
          <p className="text-slate-400">Análise de SEO em tempo real via API do SEMrush</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-surface-card border border-surface-border rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Domínio para análise</label>
            <div className="relative">
              <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="exemplo.com.br"
                value={input}
                onChange={e => setInput(e.target.value)}
                required
                className="w-full bg-surface-border border border-surface-border focus:border-brand-500 rounded-xl pl-9 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Base de dados</label>
              <select
                value={database}
                onChange={e => setDatabase(e.target.value)}
                className="w-full bg-surface-border border border-surface-border rounded-xl px-3 py-2.5 text-slate-200 focus:border-brand-500 focus:outline-none appearance-none cursor-pointer"
              >
                {DATABASES.map(db => <option key={db.value} value={db.value}>{db.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Auto-refresh</label>
              <select
                value={interval}
                onChange={e => setInterval(Number(e.target.value))}
                className="w-full bg-surface-border border border-surface-border rounded-xl px-3 py-2.5 text-slate-200 focus:border-brand-500 focus:outline-none appearance-none cursor-pointer"
              >
                {INTERVALS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors"
          >
            <Search size={15} />
            Analisar domínio
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Alerta de erro ───────────────────────────────────────────────────────────

function ErrorAlert({ message }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
      <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-red-300">Erro ao buscar dados</p>
        <p className="text-xs text-red-400/80 mt-0.5">{message}</p>
      </div>
    </div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────

function Dashboard({ domain, database, refreshInterval }) {
  const [manualKey,    setManualKey]    = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  const swrOpts = {
    refreshInterval,
    revalidateOnFocus: false,
    dedupingInterval:  30_000,
  };

  const buildKey = (ep) =>
    `/api/semrush/${ep}?domain=${encodeURIComponent(domain)}&database=${database}&_k=${manualKey}`;

  const blKey = () =>
    `/api/semrush/backlinks?domain=${encodeURIComponent(domain)}&_k=${manualKey}`;

  const { data: overviewData, error: overviewErr, isLoading: overviewLoading } =
    useSWR(buildKey('overview'), fetcher, swrOpts);

  const { data: kwData,   error: kwErr,   isLoading: kwLoading   } = useSWR(buildKey('keywords'),      fetcher, swrOpts);
  const { data: blData,   error: blErr,   isLoading: blLoading   } = useSWR(blKey(),                   fetcher, swrOpts);
  const { data: compData, error: compErr, isLoading: compLoading } = useSWR(buildKey('competitors'),   fetcher, swrOpts);
  const { data: aiData,                   isLoading: aiLoading   } = useSWR(buildKey('ai-visibility'), fetcher, swrOpts);

  const history     = overviewData?.history ?? [];
  const keywords    = kwData?.keywords      ?? [];
  const backlinks   = blData;
  const competitors = compData?.competitors  ?? [];
  const lastUpdate  = overviewData?.fetchedAt;

  // ─── Aplicar filtro de período ───────────────────────────────────────────
  // Quando um mês histórico é selecionado, buscamos os dados no histórico.
  // Quando "current", usamos o snapshot atual da API.
  const displayOverview = useMemo(() => {
    if (selectedPeriod === 'current' || !overviewData) {
      return overviewData?.overview ?? null;
    }
    // Encontra o mês no histórico (formato YYYYMM15)
    const entry = history.find(h => h.date === selectedPeriod);
    if (!entry) return overviewData?.overview ?? null;

    // Monta um objeto overview a partir dos dados históricos disponíveis
    const base = overviewData?.overview ?? {};
    return {
      ...base,
      organicKeywords: entry.keywords,
      organicTraffic:  entry.traffic,
      organicCost:     entry.cost,
    };
  }, [selectedPeriod, overviewData, history]);

  // ─── Filtrar histórico para o gráfico ────────────────────────────────────
  const chartHistory = useMemo(() => {
    if (selectedPeriod === 'current') return history;
    // Ao filtrar por mês, destaca no gráfico apenas até aquele ponto
    const idx = history.findIndex(h => h.date === selectedPeriod);
    return idx >= 0 ? history.slice(idx) : history;
  }, [selectedPeriod, history]);

  const criticalError = overviewErr || kwErr;
  const errorMsg = criticalError?.error || criticalError?.message || 'Verifique sua API key e o domínio informado.';
  const isLoading = overviewLoading || kwLoading || blLoading || compLoading;

  const handleRefresh = () => {
    setManualKey(k => k + 1);
    setSelectedPeriod('current');
  };

  return (
    <>
      <Header
        domain={domain}
        lastUpdate={lastUpdate}
        onRefresh={handleRefresh}
        refreshing={isLoading}
      />

      <PeriodBar value={selectedPeriod} onChange={setSelectedPeriod} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {criticalError && <ErrorAlert message={errorMsg} />}

        {/* KPI Cards — linha 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            title="Tráfego Orgânico Est."
            value={formatNumber(displayOverview?.organicTraffic)}
            icon={<TrendingUp size={16} />}
            color="text-brand-500"
            loading={overviewLoading}
            subtitle="visitas/mês estimadas"
          />
          <KPICard
            title="Keywords Orgânicas"
            value={formatNumber(displayOverview?.organicKeywords)}
            icon={<Key size={16} />}
            color="text-emerald-400"
            loading={overviewLoading}
            subtitle="posições no top 100"
          />
          <KPICard
            title="Backlinks"
            value={formatNumber(backlinks?.overview?.total)}
            icon={<Globe size={16} />}
            color="text-purple-400"
            loading={blLoading}
            subtitle={`${formatNumber(backlinks?.overview?.referringDomains)} domínios ref.`}
          />
          <KPICard
            title="Concorrentes"
            value={formatNumber(competitors?.length)}
            icon={<Users size={16} />}
            color="text-orange-400"
            loading={compLoading}
            subtitle="detectados via API"
          />
        </div>

        {/* KPI Cards — linha 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            title="Valor Tráfego Orgânico"
            value={formatCurrency(displayOverview?.organicCost)}
            icon={<TrendingUp size={16} />}
            color="text-yellow-400"
            loading={overviewLoading}
            subtitle="equivalente em ads/mês"
          />
          <KPICard
            title="Keywords Pagas"
            value={formatNumber(displayOverview?.paidKeywords)}
            icon={<Key size={16} />}
            color="text-pink-400"
            loading={overviewLoading}
            subtitle="anúncios ativos"
          />
          <KPICard
            title="Authority Score"
            value={backlinks?.overview?.authorityScore ?? '—'}
            icon={<Globe size={16} />}
            color="text-cyan-400"
            loading={blLoading}
            subtitle="score 0–100"
          />
          <KPICard
            title="Rank SEMrush"
            value={formatNumber(displayOverview?.rank)}
            icon={<TrendingUp size={16} />}
            color="text-slate-400"
            loading={overviewLoading}
            subtitle="posição global"
          />
        </div>

        {/* Gráfico de Tráfego */}
        <TrafficChart data={chartHistory} loading={overviewLoading} />

        {/* Concorrentes */}
        <CompetitorsChart
          competitors={competitors}
          targetDomain={domain}
          loading={compLoading}
        />

        {/* Backlinks + IA */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <BacklinksPanel data={backlinks} loading={blLoading} />
          <AIVisibilityCard data={aiData ?? null} loading={aiLoading} />
        </div>

        {/* Tabela de Keywords */}
        <KeywordsTable keywords={keywords} loading={kwLoading} />

        {/* Footer */}
        <footer className="text-center text-xs text-slate-600 pb-4">
          Dados fornecidos pela{' '}
          <a href="https://developer.semrush.com/api/" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">
            API do SEMrush
          </a>
          {refreshInterval > 0 && ` · Auto-refresh a cada ${refreshInterval / 60_000} min`}
        </footer>
      </main>
    </>
  );
}

// ─── Página raiz ──────────────────────────────────────────────────────────────

export default function Home() {
  const [config, setConfig] = useState(null);

  if (!config) return <SearchForm onSubmit={(d, db, i) => setConfig({ domain: d, database: db, interval: i })} />;

  return <Dashboard domain={config.domain} database={config.database} refreshInterval={config.interval} />;
}
