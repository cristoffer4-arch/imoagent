interface ScoreBadgeProps {
  score: number;
  mode: 'angariacao' | 'venda';
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, mode, size = 'md' }: ScoreBadgeProps) {
  // Determine color based on score
  const getColorClasses = () => {
    if (score >= 75) {
      return mode === 'angariacao'
        ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40'
        : 'bg-blue-500/20 text-blue-300 ring-blue-500/40';
    }
    if (score >= 50) {
      return 'bg-yellow-500/20 text-yellow-300 ring-yellow-500/40';
    }
    return 'bg-slate-500/20 text-slate-300 ring-slate-500/40';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base font-bold';
      default:
        return 'px-3 py-1 text-sm font-semibold';
    }
  };

  const label = mode === 'angariacao' ? 'Score Angariação' : 'Score Venda';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full ring-1 ${getColorClasses()} ${getSizeClasses()}`}
    >
      <span className="opacity-80">{label}:</span>
      <span className="font-bold">{score.toFixed(0)}</span>
    </div>
  );
}
