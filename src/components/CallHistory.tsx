import { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Search, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ChevronLeft,
  Phone,
  BarChart3,
  Trash2,
  FileText,
  MessageSquare,
  BrainCircuit,
  Handshake,
  AlertCircle
} from 'lucide-react';
import type { CallHistoryItem, Call, Sentiment } from '../types';
import { cn } from '../utils/cn';
import { useCallStore } from '../store/callStore';

interface CallHistoryProps {
  history: CallHistoryItem[];
  onSelectCall?: (call: CallHistoryItem) => void;
}

const formatKES = (amount: number) => {
  return new Intl.NumberFormat('en-KE').format(amount);
};

export function CallHistory({ history, onSelectCall }: CallHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewDetailId, setViewDetailId] = useState<string | null>(null);
  const { clearHistory, getCallDetail } = useCallStore();
  const detailCall = viewDetailId ? getCallDetail(viewDetailId) : null;

  const filteredHistory = history.filter((call) =>
    call.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    call.customer.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (call.fullTranscript?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalCalls = history.length;
  const avgSentimentScore = history.length > 0
    ? Math.round(
        history.reduce((sum, c) => {
          const score = c.sentiment === 'positive' ? 80 : c.sentiment === 'neutral' ? 50 : 20;
          return sum + score;
        }, 0) / history.length
      )
    : 0;
  const totalPromised = history.reduce((sum, c) => sum + c.totalPromisedAmount, 0);

  const handleSelectCall = (call: CallHistoryItem) => {
    setSelectedId(call.id);
    onSelectCall?.(call);
  };

  if (viewDetailId && detailCall) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg flex flex-col max-w-4xl mx-auto">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-3">
          <button
            onClick={() => setViewDetailId(null)}
            className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{detailCall.customer.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{format(new Date(detailCall.startedAt), 'MMM d, yyyy h:mm a')}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Transcript */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
              Transcript
            </h4>
            {detailCall.transcript.length > 0 ? (
              <div className="space-y-2">
                {detailCall.transcript.map((entry) => (
                  <div key={entry.id} className="flex gap-2 text-xs">
                    <span className="text-[10px] font-medium text-slate-400 w-12 flex-shrink-0 pt-0.5">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex-1 p-2 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed">
                      {entry.text}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No transcript recorded</p>
            )}
          </div>

          {/* Extraction */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-500" />
              AI Extraction
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
              <DetailStat label="Promises" value={String(detailCall.extraction.promises.length)} icon={Handshake} color="text-emerald-500" />
              <DetailStat label="Objections" value={String(detailCall.extraction.objections.length)} icon={AlertCircle} color="text-red-500" />
              <DetailStat label="Agreements" value={String(detailCall.extraction.agreements.length)} icon={Handshake} color="text-sky-500" />
            </div>
            {detailCall.extraction.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {detailCall.extraction.keywords.map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-400 rounded-full">
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {detailCall.summary && (
            <div>
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Summary</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-700 p-3 rounded-md">
                {detailCall.summary.summaryText}
              </p>
              {detailCall.summary.nextActions.length > 0 && (
                <div className="mt-2">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Next Actions:</p>
                  <ul className="space-y-1">
                    {detailCall.summary.nextActions.map((action, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg flex flex-col max-w-3xl mx-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Session History</h3>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all history?')) {
                  clearHistory();
                }
              }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear All
            </button>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, account, or transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200/60 dark:border-slate-600/60 rounded-md text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Analytics Summary */}
      {history.length > 0 && (
        <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
          {[
            { icon: Phone, value: totalCalls.toString(), label: 'Total Sessions', color: 'text-slate-500' },
            { icon: BarChart3, value: `${avgSentimentScore}%`, label: 'Avg Sentiment', color: avgSentimentScore >= 60 ? 'text-emerald-500' : avgSentimentScore >= 40 ? 'text-amber-500' : 'text-red-500' },
            { icon: null, value: totalPromised > 0 ? `${(totalPromised / 1000).toFixed(1)}K` : '0', label: 'Promised', color: 'text-emerald-500', prefix: 'KES ' },
          ].map((stat, i) => (
            <div key={i} className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded-md">
              {stat.icon && <stat.icon className={cn('w-3.5 h-3.5 mx-auto mb-0.5', stat.color)} />}
              {stat.prefix && <span className="text-[10px] font-bold text-emerald-500">KES</span>}
              <p className={cn('text-sm font-bold tabular-nums', stat.color)}>
                {stat.prefix ? `${stat.prefix}${stat.value}` : stat.value}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Call List */}
      <div className="flex-1 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
            {history.length === 0 ? (
              <>
                <FileText className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">No sessions yet</p>
              </>
            ) : (
              <>
                <Search className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">No matching sessions found</p>
              </>
            )}
          </div>
        ) : (
          <AnimatePresence>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredHistory.map((call) => (
                <CallHistoryCard
                  key={call.id}
                  call={call}
                  isSelected={selectedId === call.id}
                  onViewDetail={() => setViewDetailId(call.id)}
                  onClick={() => handleSelectCall(call)}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

interface CallHistoryCardProps {
  call: CallHistoryItem;
  isSelected: boolean;
  onClick: () => void;
  onViewDetail: () => void;
}

function CallHistoryCard({ call, isSelected, onClick, onViewDetail }: CallHistoryCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sentimentConfig: Record<Sentiment, { icon: typeof TrendingUp; color: string }> = {
    positive: { icon: TrendingUp, color: 'text-emerald-500' },
    neutral: { icon: Minus, color: 'text-slate-500' },
    negative: { icon: TrendingDown, color: 'text-red-500' },
  };

  const { icon: SentIcon, color } = sentimentConfig[call.sentiment];

  return (
    <motion.button
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      className={cn(
        'w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all duration-200',
        isSelected && 'bg-indigo-50/50 dark:bg-indigo-900/10 border-l-[3px] border-indigo-500'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {call.customer.name}
            </span>
            <SentIcon className={cn('w-3.5 h-3.5 flex-shrink-0', color)} />
          </div>
          <div className="flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{format(new Date(call.startedAt), 'MMM d, yyyy')}</span>
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {formatDuration(call.duration)}
            </span>
          </div>
          {call.promisesCount > 0 && (
            <div className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
              <span className="font-semibold">KES</span>
              <span>{call.totalPromisedAmount > 0 ? formatKES(call.totalPromisedAmount) : '0'} promised</span>
            </div>
          )}
          {call.summary && (
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {call.summary}
            </p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onViewDetail(); }}
          className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex-shrink-0 mt-0.5"
          title="View details"
        >
          <FileText className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>
    </motion.button>
  );
}

function DetailStat({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Phone; color: string }) {
  return (
    <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded-md">
      <Icon className={cn('w-3.5 h-3.5 mx-auto mb-0.5', color)} />
      <p className={cn('text-sm font-bold tabular-nums', color)}>{value}</p>
      <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
