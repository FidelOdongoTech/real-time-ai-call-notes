import { motion } from 'framer-motion';
import { Phone, Calendar, Clock, DollarSign, Target, CheckCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Call } from '../types';

interface CallSummaryProps {
  call: Call;
}

export function CallSummary({ call }: CallSummaryProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const totalPromised = call.extraction.promises.reduce((sum, p) => sum + (p.amount || 0), 0);
  const resolutionStatus = call.extraction.agreements.length > 0 ? 'Agreement Reached' : 'No Agreement';
  const hasPromises = call.extraction.promises.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-emerald-500 flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Session Complete</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(call.startedAt)}</p>
        </div>
        <div className="ml-auto">
          <span className={cn(
            'px-2 py-0.5 text-[10px] font-semibold rounded-full',
            call.extraction.agreements.length > 0
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
          )}>
            {resolutionStatus}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <SummaryStat icon={Clock} label="Duration" value={formatTime(call.duration)} />
          <SummaryStat icon={Target} label="Promises" value={String(call.extraction.promises.length)} />
          <SummaryStat icon={Phone} label="Outcome" value={resolutionStatus} />
        </div>

        {hasPromises && (
          <div className="bg-slate-50 dark:bg-slate-700 rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Total Promised</span>
            </div>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              KES {new Intl.NumberFormat('en-KE').format(totalPromised)}
            </p>
          </div>
        )}

        {call.summary?.summaryText && (
          <div>
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Summary</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{call.summary.summaryText}</p>
          </div>
        )}

        {call.summary?.nextActions && call.summary.nextActions.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Next Actions</h4>
            <ul className="space-y-1">
              {call.summary.nextActions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 flex-shrink-0" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SummaryStat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded-md">
      <Icon className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
      <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{value}</p>
      <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
