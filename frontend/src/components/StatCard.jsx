export function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-400',
    red:    'from-red-500/10 to-red-600/5 border-red-500/20 text-red-400',
    orange: 'from-orange-500/10 to-orange-600/5 border-orange-500/20 text-orange-400',
    green:  'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4`}>
      <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-3xl font-black ${colors[color].split(' ').pop()}`}>{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}