import { Building2, TrendingUp } from 'lucide-react';

interface ModeSelectorProps {
  mode: 'angariacao' | 'venda';
  onChange: (mode: 'angariacao' | 'venda') => void;
}

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="flex gap-3 p-1 bg-slate-900/50 rounded-2xl border border-white/10 backdrop-blur">
      <button
        onClick={() => onChange('angariacao')}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
          mode === 'angariacao'
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`}
      >
        <Building2 size={20} />
        <span>Busca para Angariação</span>
      </button>

      <button
        onClick={() => onChange('venda')}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
          mode === 'venda'
            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`}
      >
        <TrendingUp size={20} />
        <span>Busca para Venda</span>
      </button>
    </div>
  );
}
