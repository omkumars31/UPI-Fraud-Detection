import { RiskBadge } from './RiskBadge';
import { formatDistanceToNow } from 'date-fns';

export function TransactionFeed({ transactions }) {
  if (!transactions.length) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
        Waiting for transactions...
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
      {transactions.map((item, idx) => {
        const txn     = item.transaction || item;
        const scoring = item.scoring;
        const isNew   = idx === 0;

        return (
          <div
            key={txn.id || idx}
            className={`rounded-lg border p-3 transition-all duration-500 ${
              scoring?.shouldAlert
                ? 'bg-red-500/5 border-red-500/20'
                : 'bg-slate-800/50 border-slate-700/50'
            } ${isNew ? 'ring-1 ring-blue-500/40' : ''}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-200 font-medium truncate">
                    {txn._senderName || txn.sender_upi_id}
                  </span>
                  <span className="text-slate-500">→</span>
                  <span className="text-slate-300 truncate">
                    {txn._receiverName || txn.receiver_upi_id}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-400">
                    ₹{parseFloat(txn.amount).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-500">{txn.location}</span>
                  <span className="text-xs text-slate-600">
                    {formatDistanceToNow(new Date(txn.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
              {scoring && <RiskBadge score={scoring.score} tier={scoring.tier} />}
            </div>

            {scoring?.reasons?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {scoring.reasons.map((r, i) => (
                  <span key={i} className="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded">
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}