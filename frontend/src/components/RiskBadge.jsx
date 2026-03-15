export function RiskBadge({ score, tier }) {
  const config = {
    LOW:      { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    MEDIUM:   { bg: 'bg-yellow-500/20',  text: 'text-yellow-400',  border: 'border-yellow-500/30'  },
    HIGH:     { bg: 'bg-orange-500/20',  text: 'text-orange-400',  border: 'border-orange-500/30'  },
    CRITICAL: { bg: 'bg-red-500/20',     text: 'text-red-400',     border: 'border-red-500/30'     },
  };

  const label = tier?.label || 'LOW';
  const c = config[label] || config.LOW;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.text.replace('text', 'bg')}`} />
      {score} · {label}
    </span>
  );
}