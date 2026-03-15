import { useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { fetchInitialStats, fetchRecentAlerts, fetchRecentTransactions } from './services/api';
import { StatCard } from './components/StatCard';
import { TransactionFeed } from './components/TransactionFeed';
import { AlertPanel } from './components/AlertPanel';

export default function App() {
  const { transactions, alerts, stats, setStats, connected } = useWebSocket();

  // Load initial data from REST on mount
  useEffect(() => {
    async function loadInitial() {
      try {
        const [s] = await Promise.all([
          fetchInitialStats(),
          fetchRecentTransactions(20),
          fetchRecentAlerts(10),
        ]);
        setStats(s);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    }
    loadInitial();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono">

      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">
              UPI Fraud Detection
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time transaction monitoring · Risk scoring engine v1.0
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-slate-400">
              {connected ? 'Live' : 'Reconnecting...'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Transactions"
            value={stats?.total_transactions ?? '—'}
            sub="Last 24 hours"
            color="blue"
          />
          <StatCard
            label="Flagged"
            value={stats?.flagged_count ?? '—'}
            sub="Score ≥ 60"
            color="red"
          />
          <StatCard
            label="Critical"
            value={stats?.critical_count ?? '—'}
            sub="Score ≥ 80"
            color="orange"
          />
          <StatCard
            label="Avg Risk Score"
            value={stats?.avg_risk_score ? parseFloat(stats.avg_risk_score).toFixed(1) : '—'}
            sub="Across all transactions"
            color="green"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Transaction Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Live Transaction Feed
              </h2>
              <span className="text-xs text-slate-500">
                {transactions.length} loaded
              </span>
            </div>
            <TransactionFeed transactions={transactions} />
          </div>

          {/* Alert Panel */}
          <div className="bg-slate-900 border border-red-900/30 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider">
                Fraud Alerts
              </h2>
              <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                {alerts.length} active
              </span>
            </div>
            <AlertPanel alerts={alerts} />
          </div>

        </div>
      </main>
    </div>
  );
}