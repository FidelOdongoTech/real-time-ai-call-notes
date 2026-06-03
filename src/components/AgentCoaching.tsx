import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  AlertTriangle, 
  Heart, 
  Shield, 
  ThumbsUp, 
  MessageSquare,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  Zap
} from 'lucide-react';
import { cn } from '../utils/cn';
import { getAICoachingSuggestions, resetCoachingCache } from '../services/geminiService';

interface CoachingSuggestion {
  id: string;
  type: 'de_escalation' | 'empathy' | 'objection_handling' | 'closing' | 'rapport' | 'verification' | 'general';
  priority: 'urgent' | 'important' | 'normal';
  title: string;
  titleSw: string;
  description: string;
  suggestedPhrases: string[];
  suggestedPhrasesSw: string[];
}

interface AgentCoachingProps {
  isActive: boolean;
  transcript: string;
  sentiment: number;
  customerName: string;
  debtAmount: number;
  language: 'en-KE' | 'sw-KE';
}

export const AgentCoaching: React.FC<AgentCoachingProps> = ({
  isActive,
  transcript,
  sentiment,
  customerName,
  debtAmount,
  language
}) => {
  const [suggestions, setSuggestions] = useState<CoachingSuggestion[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastProcessedLength, setLastProcessedLength] = useState(0);

  const isSwahili = language === 'sw-KE';

  useEffect(() => {
    if (!isActive) {
      resetCoachingCache();
      setSuggestions([]);
      setLastProcessedLength(0);
    }
  }, [isActive]);

  const fetchSuggestions = useCallback(async () => {
    if (!isActive || transcript.length < 20) return;
    if (transcript.length - lastProcessedLength < 50) return;

    setIsLoading(true);
    
    try {
      const lastStatement = transcript.split(/[.!?]/).filter(Boolean).pop()?.trim() || '';
      
      const aiSuggestions = await getAICoachingSuggestions({
        customerName,
        debtAmount,
        transcript,
        lastStatement,
        detectedSentiment: sentiment < 40 ? 'negative' : sentiment > 60 ? 'positive' : 'neutral',
        language
      });

      if (aiSuggestions.length > 0) {
        setSuggestions(aiSuggestions);
        setLastProcessedLength(transcript.length);
      }
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isActive, transcript, customerName, debtAmount, sentiment, language, lastProcessedLength]);

  useEffect(() => {
    const timer = setTimeout(fetchSuggestions, 1000);
    return () => clearTimeout(timer);
  }, [fetchSuggestions]);

  const copyPhrase = (phrase: string, id: string) => {
    navigator.clipboard.writeText(phrase);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'de_escalation': return <Shield className="w-3.5 h-3.5 text-red-500" />;
      case 'empathy': return <Heart className="w-3.5 h-3.5 text-pink-500" />;
      case 'objection_handling': return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      case 'closing': return <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />;
      case 'rapport': return <MessageSquare className="w-3.5 h-3.5 text-sky-500" />;
      case 'verification': return <Check className="w-3.5 h-3.5 text-violet-500" />;
      default: return <Lightbulb className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded uppercase tracking-wider">URGENT</span>;
      case 'important':
        return <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded uppercase tracking-wider">IMPORTANT</span>;
      default:
        return null;
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {isSwahili ? 'Ushauri wa AI' : 'AI Coaching'}
          </h3>
          <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded uppercase tracking-wider">
            Gemini
          </span>
        </div>
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />}
      </div>

      {/* Sentiment Alert */}
      <AnimatePresence>
        {sentiment < 35 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mt-3 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/50 rounded-md"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-red-800 dark:text-red-200">
                  {isSwahili ? 'Mteja anaonekana kukasirika!' : 'Customer seems upset!'}
                </span>
                <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">
                  {isSwahili ? 'Tumia lugha ya kutuliza' : 'Use calming language and show empathy'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions */}
      <div className="p-4 space-y-2">
        {isLoading && suggestions.length === 0 && (
          <div className="text-center text-slate-500 dark:text-slate-400 py-6">
            <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-indigo-500" />
            <p className="text-xs">{isSwahili ? 'Inachanganua...' : 'Analyzing...'}</p>
          </div>
        )}
        
        <AnimatePresence>
          {suggestions.map((suggestion) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'border rounded-md overflow-hidden transition-colors',
                suggestion.priority === 'urgent' 
                  ? 'border-red-200/60 dark:border-red-800/50 bg-red-50/30 dark:bg-red-900/5' 
                  : suggestion.priority === 'important'
                    ? 'border-amber-200/60 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-900/5'
                    : 'border-slate-200/60 dark:border-slate-700/50'
              )}
            >
              <button
                onClick={() => setExpandedId(expandedId === suggestion.id ? null : suggestion.id)}
                className="w-full flex items-center justify-between p-2.5 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getTypeIcon(suggestion.type)}
                  <span className="text-xs font-medium text-slate-900 dark:text-white truncate">
                    {isSwahili ? suggestion.titleSw : suggestion.title}
                  </span>
                  {getPriorityBadge(suggestion.priority)}
                </div>
                {expandedId === suggestion.id ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                )}
              </button>

              {expandedId === suggestion.id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-2.5 pb-2.5 border-t border-slate-100 dark:border-slate-700/50"
                >
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 mb-2 leading-relaxed">
                    {suggestion.description}
                  </p>
                  
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {isSwahili ? 'Maneno Yanayopendekezwa:' : 'Suggested Phrases:'}
                    </p>
                    
                    {(isSwahili ? suggestion.suggestedPhrasesSw : suggestion.suggestedPhrases).map((phrase, index) => (
                      <button
                        key={index}
                        onClick={() => copyPhrase(phrase, `${suggestion.id}-${index}`)}
                        className="w-full flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/80 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group text-left"
                      >
                        <span className="text-[11px] text-slate-700 dark:text-slate-300 italic leading-relaxed">
                          "{phrase}"
                        </span>
                        {copiedId === `${suggestion.id}-${index}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {suggestions.length === 0 && !isLoading && (
          <div className="text-center text-slate-400 dark:text-slate-500 py-6">
            <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs">
              {isSwahili 
                ? 'Anza kuzungumza ili kupata ushauri'
                : 'Start speaking to get AI suggestions'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
