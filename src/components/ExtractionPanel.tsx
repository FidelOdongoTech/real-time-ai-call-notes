import { 
  HandCoins, 
  AlertCircle, 
  Handshake, 
  Quote, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Tag
} from 'lucide-react';

// Format number with Kenyan locale
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">AI Insights</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {isActive ? 'Analyzing in real-time...' : 'Call analysis'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Sentiment */}
        <SentimentCard 
          sentiment={extraction.sentiment} 
          score={extraction.sentimentScore} 
        />

        {/* Keywords */}
        {extraction.keywords.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-500" />
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Keywords Detected</h4>
            </div>
            <div className="flex flex-wrap gap-1">
              {extraction.keywords.map((keyword, i) => (
                <span 
                  key={i}
                  className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
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
          color="green"
          renderItem={(promise: Promise) => (
            <div key={promise.id} className="space-y-1">
              <p className="text-sm text-gray-700 dark:text-gray-300">{promise.description}</p>
              <div className="flex items-center gap-3 text-xs">
                {promise.amount && (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <span className="text-xs font-bold">KES</span>
                    {formatKES(promise.amount)}
                  </span>
                )}
                {promise.dueDate && (
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
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
          color="yellow"
          renderItem={(objection: Objection) => (
            <div key={objection.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium capitalize',
                  objection.severity === 'high' && 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
                  objection.severity === 'medium' && 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
                  objection.severity === 'low' && 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                )}>
                  {objection.severity}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {objection.type.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{objection.description}</p>
            </div>
          )}
        />

        {/* Agreements */}
        <ExtractSection
          title="Agreements Reached"
          icon={Handshake}
          items={extraction.agreements}
          color="blue"
          renderItem={(agreement: Agreement) => (
            <div key={agreement.id} className="space-y-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium capitalize">
                {agreement.type.replace('_', ' ')}
              </span>
              <p className="text-sm text-gray-700 dark:text-gray-300">{agreement.details}</p>
            </div>
          )}
        />

        {/* Key Quotes */}
        {extraction.keyQuotes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Quote className="w-4 h-4 text-purple-500" />
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Key Quotes</h4>
            </div>
            <div className="space-y-2">
              {extraction.keyQuotes.slice(-3).map((quote, i) => (
                <blockquote 
                  key={i}
                  className="text-sm italic text-gray-600 dark:text-gray-400 border-l-2 border-purple-300 dark:border-purple-600 pl-3"
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
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            <p className="text-sm">
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
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/30',
      bar: 'bg-green-500',
      label: 'Positive',
    },
    neutral: {
      icon: Minus,
      color: 'text-gray-600 dark:text-gray-400',
      bg: 'bg-gray-50 dark:bg-gray-700/50',
      bar: 'bg-gray-500',
      label: 'Neutral',
    },
    negative: {
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/30',
      bar: 'bg-red-500',
      label: 'Negative',
    },
  };

  const { icon: Icon, color, bg, bar, label } = config[sentiment];

  return (
    <div className={cn('rounded-lg p-3', bg)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', color)} />
          <span className={cn('text-sm font-medium', color)}>{label}</span>
        </div>
        <span className={cn('text-lg font-bold', color)}>{score}%</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
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
  color: 'green' | 'yellow' | 'blue';
  renderItem: (item: T) => React.ReactNode;
}

function ExtractSection<T>({ title, icon: Icon, items, color, renderItem }: ExtractSectionProps<T>) {
  const colors = {
    green: {
      icon: 'text-green-500',
      badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800',
    },
    yellow: {
      icon: 'text-yellow-500',
      badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
      border: 'border-yellow-200 dark:border-yellow-800',
    },
    blue: {
      icon: 'text-blue-500',
      badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
    },
  };

  const c = colors[color];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', c.icon)} />
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h4>
        </div>
        {items.length > 0 && (
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', c.badge)}>
            {items.length}
          </span>
        )}
      </div>
      {items.length > 0 ? (
        <div className={cn('space-y-2 pl-3 border-l-2', c.border)}>
          {items.map((item) => renderItem(item))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-500 pl-6">No {title.toLowerCase()} yet</p>
      )}
    </div>
  );
}
