import { useState } from 'react';
import { format } from 'date-fns';
import { 
  History, 
  Search, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ChevronRight,
  Phone,
  BarChart3,
  Trash2,
  FileText
} from 'lucide-react';
import type { CallHistoryItem, Sentiment } from '../types';
import { cn } from '../utils/cn';
import { useCallStore } from '../store/callStore';

interface CallHistoryProps {
  history: CallHistoryItem[];
  onSelectCall?: (call: CallHistoryItem) => void;
}

// Format number with Kenyan locale
const formatKES = (amount: number) => {
  return new Intl.NumberFormat('en-KE').format(amount);
};

export function CallHistory({ history, onSelectCall }: CallHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { clearHistory } = useCallStore();

  const filteredHistory = history.filter((call) =>
    call.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    call.customer.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (call.fullTranscript?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Analytics
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Session History</h3>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all history?')) {
                  clearHistory();
                }
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear All
            </button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, account, or transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Analytics Summary */}
      {history.length > 0 && (
        <div className="grid grid-cols-3 gap-2 p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <Phone className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">{totalCalls}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Sessions</p>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <BarChart3 className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">{avgSentimentScore}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg Sentiment</p>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-purple-500 font-bold text-xs">KES</span>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {totalPromised > 0 ? `${(totalPromised / 1000).toFixed(1)}K` : '0'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Promised</p>
          </div>
        </div>
      )}

      {/* Call List */}
      <div className="flex-1 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-500">
            {history.length === 0 ? (
              <>
                <FileText className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">No sessions yet</p>
                <p className="text-xs mt-1">Start a new session to see history here</p>
              </>
            ) : (
              <>
                <Search className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">No matching sessions found</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredHistory.map((call) => (
              <CallHistoryCard
                key={call.id}
                call={call}
                isSelected={selectedId === call.id}
                onClick={() => handleSelectCall(call)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CallHistoryCardProps {
  call: CallHistoryItem;
  isSelected: boolean;
  onClick: () => void;
}

function CallHistoryCard({ call, isSelected, onClick }: CallHistoryCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sentimentConfig: Record<Sentiment, { icon: typeof TrendingUp; color: string }> = {
    positive: { icon: TrendingUp, color: 'text-green-500' },
    neutral: { icon: Minus, color: 'text-gray-500' },
    negative: { icon: TrendingDown, color: 'text-red-500' },
  };

  const { icon: SentIcon, color } = sentimentConfig[call.sentiment];

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
        isSelected && 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-white truncate">
              {call.customer.name}
            </span>
            <SentIcon className={cn('w-4 h-4 flex-shrink-0', color)} />
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              {format(new Date(call.startedAt), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(call.duration)}
            </span>
          </div>
          {call.promisesCount > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <span className="font-bold">KES</span>
              <span>{call.promisesCount} promise(s) - KES {formatKES(call.totalPromisedAmount)}</span>
            </div>
          )}
          {call.summary && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {call.summary}
            </p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}
