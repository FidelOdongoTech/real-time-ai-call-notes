import { 
  HandCoins, 
  AlertCircle, 
  Handshake, 
  Quote, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Tag,
  BrainCircuit
} from 'lucide-react';

const formatKES = (amount: number) => {
  return new Intl.NumberFormat('en-KE').format(amount);
};
import type { CallExtraction, Promise, Objection, Agreement, Sentiment } from '../types';
import { cn } from '../utils/cn';

interface ExtractionPanelProps {
  extraction: CallExtraction;
  isActive: boolean;
}

export function ExtractionPanel({ extraction, isActive }: ExtractionPanelProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg flex flex-col h-full min-h-[500px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">AI Intelligence</h3>
          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Sentiment */}
        <SentimentCard 
          sentiment={extraction.sentiment} 
          score={extraction.sentimentScore} 
        />

        {/* Keywords */}
        {extraction.keywords.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <h4 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Keywords</h4>
            </div>
            <div className="flex flex-wrap gap-1">
              {extraction.keywords.map((keyword, i) => (
                <span 
                  key={i}
                  className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-medium rounded"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Promises */}
        <ExtractSection
          title="Promises Made"
          icon={HandCoins}
          items={extraction.promises}
          color="emerald"
          renderItem={(promise: Promise) => (
            <div key={promise.id} className="space-y-0.5">
              <p className="text-xs text-slate-700 dark:text-slate-300">{promise.description}</p>
              <div className="flex items-center gap-2">
                {promise.amount && (
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    KES {formatKES(promise.amount)}
                  </span>
                )}
                {promise.dueDate && (
                  <span className="flex items-center gap-0.5 text-[11px] text-sky-600 dark:text-sky-400">
                    <Calendar className="w-3 h-3" />
                    {promise.dueDate}
                  </span>
                )}
              </div>
            </div>
          )}
        />

        {/* Objections */}
        <ExtractSection
          title="Objections Raised"
          icon={AlertCircle}
          items={extraction.objections}
          color="amber"
          renderItem={(objection: Objection) => (
            <div key={objection.id} className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded font-medium capitalize',
                  objection.severity === 'high' && 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
                  objection.severity === 'medium' && 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
                  objection.severity === 'low' && 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                )}>
                  {objection.severity}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                  {objection.type.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">{objection.description}</p>
            </div>
          )}
        />

        {/* Agreements */}
        <ExtractSection
          title="Agreements Reached"
          icon={Handshake}
          items={extraction.agreements}
          color="sky"
          renderItem={(agreement: Agreement) => (
            <div key={agreement.id} className="space-y-0.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 font-medium capitalize">
                {agreement.type.replace('_', ' ')}
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300">{agreement.details}</p>
            </div>
          )}
        />

        {/* Key Quotes */}
        {extraction.keyQuotes.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Quote className="w-3.5 h-3.5 text-slate-400" />
              <h4 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Key Quotes</h4>
            </div>
            <div className="space-y-1.5">
              {extraction.keyQuotes.slice(-3).map((quote, i) => (
                <blockquote 
                  key={i}
                  className="text-xs italic text-slate-500 dark:text-slate-400 border-l-2 border-indigo-300 dark:border-indigo-600 pl-2.5 leading-relaxed"
                >
                  "{quote}"
                </blockquote>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {extraction.promises.length === 0 && 
         extraction.objections.length === 0 && 
         extraction.agreements.length === 0 && 
         extraction.keyQuotes.length === 0 && (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500">
            <BrainCircuit className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-xs leading-relaxed">
              {isActive 
                ? 'Start speaking to see AI insights appear here...'
                : 'No significant data extracted yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface SentimentCardProps {
  sentiment: Sentiment;
  score: number;
}

function SentimentCard({ sentiment, score }: SentimentCardProps) {
  const config = {
    positive: {
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      bar: 'bg-emerald-500',
      label: 'Positive',
    },
    neutral: {
      icon: Minus,
      color: 'text-slate-500 dark:text-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-700/80',
      bar: 'bg-slate-400',
      label: 'Neutral',
    },
    negative: {
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      bar: 'bg-red-500',
      label: 'Negative',
    },
  };

  const { icon: Icon, color, bg, bar, label } = config[sentiment];

  return (
    <div className={cn('rounded-md p-3', bg)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-3.5 h-3.5', color)} />
          <span className={cn('text-xs font-semibold', color)}>{label}</span>
        </div>
        <span className={cn('text-sm font-bold tabular-nums', color)}>{score}%</span>
      </div>
      <div className="h-1.5 bg-white/50 dark:bg-slate-700/80 rounded-full overflow-hidden">
        <div 
          className={cn('h-full rounded-full transition-all duration-500', bar)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

interface ExtractSectionProps<T> {
  title: string;
  icon: typeof HandCoins;
  items: T[];
  color: 'emerald' | 'amber' | 'sky';
  renderItem: (item: T) => React.ReactNode;
}

function ExtractSection<T>({ title, icon: Icon, items, color, renderItem }: ExtractSectionProps<T>) {
  const colors = {
    emerald: {
      icon: 'text-emerald-500',
      badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    amber: {
      icon: 'text-amber-500',
      badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
    },
    sky: {
      icon: 'text-sky-500',
      badge: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-800',
    },
  };

  const c = colors[color];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className={cn('w-3.5 h-3.5', c.icon)} />
          <h4 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h4>
        </div>
        {items.length > 0 && (
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', c.badge)}>
            {items.length}
          </span>
        )}
      </div>
      {items.length > 0 ? (
        <div className={cn('space-y-1.5 pl-3 border-l-2', c.border)}>
          {items.map((item) => renderItem(item))}
        </div>
      ) : (
        <p className="text-[11px] text-slate-400 dark:text-slate-500">No {title.toLowerCase()} yet</p>
      )}
    </div>
  );
}
