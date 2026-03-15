import { RiskBadge } from './RiskBadge';
import { formatDistanceToNow } from 'date-fns';

export function AlertPanel({ alerts }) {
  if (!alerts.length) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
        No alerts yet — monitoring live...
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
      {alerts.map((item, idx) => {
        const txn   = item.transaction || item;
        const alert = item.alert;
        const scoring = item.scoring;

        return (
          <div
            key={alert?.id || idx}
            className="rounded-xl border border-red-500/30 bg-red-500/5 p-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {txn._senderName || txn.sender_upi_id}
                  <span className="text-slate-500 font-normal">→</span>
                  {txn._receiverName || txn.receiver_upi_id}
                </div>
                <div className="flex gap-3 mt-1">
                  <span className="text-sm font-bold text-white">
                    ₹{parseFloat(txn.amount).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-400 self-center">{txn.location}</span>
                  <span className="text-xs text-slate-500 self-center">
                    {alert?.triggered_at &&
                      formatDistanceToNow(new Date(alert.triggered_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              {scoring && <RiskBadge score={scoring.score} tier={scoring.tier} />}
            </div>

            {/* Triggered signals */}
            {scoring?.triggeredFlags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {scoring.triggeredFlags.map((flag) => (
                  <span
                    key={flag}
                    className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full"
                  >
                    {flag.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}

            {/* AI Explanation */}
            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">
                AI Analyst Explanation
              </p>
              {alert?.ai_explanation ? (
                <p className="text-sm text-slate-300 leading-relaxed">
                  {alert.ai_explanation}
                </p>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Analyzing with AI...
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}