import React, { useState, useEffect, useCallback } from 'react';
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

  // Reset cache when session ends
  useEffect(() => {
    if (!isActive) {
      resetCoachingCache();
      setSuggestions([]);
      setLastProcessedLength(0);
    }
  }, [isActive]);

  // Fetch AI suggestions when transcript changes significantly
  const fetchSuggestions = useCallback(async () => {
    if (!isActive || transcript.length < 20) return;
    
    // Only fetch if transcript has grown by at least 50 characters
    if (transcript.length - lastProcessedLength < 50) return;

    setIsLoading(true);
    
    try {
      const lastStatement = transcript.split(/[.!?]/).filter(Boolean).pop()?.trim() || '';
      
      const aiSuggestions = await getAICoachingSuggestions({
        customerName,
        debtAmount,
        transcript,
        lastStatement,
        detectedSentiment: sentiment < 0.4 ? 'negative' : sentiment > 0.6 ? 'positive' : 'neutral',
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

  // Debounced fetch
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
      case 'de_escalation': return <Shield className="w-4 h-4 text-red-500" />;
      case 'empathy': return <Heart className="w-4 h-4 text-pink-500" />;
      case 'objection_handling': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'closing': return <ThumbsUp className="w-4 h-4 text-green-500" />;
      case 'rapport': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'verification': return <Check className="w-4 h-4 text-purple-500" />;
      default: return <Lightbulb className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium">URGENT</span>;
      case 'important':
        return <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full font-medium">IMPORTANT</span>;
      default:
        return null;
    }
  };

  if (!isActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-4">
        <Sparkles className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-center text-sm">
          {isSwahili 
            ? 'Ushauri wa AI utaonekana hapa wakati wa mazungumzo'
            : 'AI coaching suggestions will appear here during active sessions'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {isSwahili ? 'Ushauri wa AI' : 'AI Coaching'}
          </h3>
          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
            Gemini AI
          </span>
        </div>
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        )}
      </div>

      {/* Sentiment Alert */}
      {sentiment < 0.35 && (
        <div className="mx-3 mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-pulse">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">
              {isSwahili ? '⚠️ Mteja anaonekana kukasirika!' : '⚠️ Customer seems upset!'}
            </span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {isSwahili 
              ? 'Tumia lugha ya kutuliza hali na onyesha huruma'
              : 'Use calming language and show empathy'
            }
          </p>
        </div>
      )}

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoading && suggestions.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
            <p className="text-sm">
              {isSwahili 
                ? 'Inachanganua mazungumzo...'
                : 'Analyzing conversation with Gemini AI...'
              }
            </p>
            <p className="text-xs mt-2 text-gray-400">
              {transcript.length} characters processed
            </p>
          </div>
        )}
        
        {suggestions.length === 0 && !isLoading && transcript.length >= 20 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {isSwahili 
                ? 'Endelea kuzungumza... Mapendekezo yatakuja'
                : 'Keep talking... Suggestions will appear'
              }
            </p>
            <p className="text-xs mt-2 text-gray-400">
              ({transcript.length} chars, needs 50+ more for analysis)
            </p>
          </div>
        )}
        
        {suggestions.length === 0 && !isLoading && transcript.length < 20 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {isSwahili 
                ? 'Anza kuzungumza ili kupata ushauri'
                : 'Start speaking to get AI suggestions'
              }
            </p>
          </div>
        )}

        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`
              border rounded-lg overflow-hidden transition-all
              ${suggestion.priority === 'urgent' 
                ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10' 
                : suggestion.priority === 'important'
                  ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }
            `}
          >
            {/* Suggestion Header */}
            <button
              onClick={() => setExpandedId(expandedId === suggestion.id ? null : suggestion.id)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1">
                {getTypeIcon(suggestion.type)}
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {isSwahili ? suggestion.titleSw : suggestion.title}
                </span>
                {getPriorityBadge(suggestion.priority)}
              </div>
              {expandedId === suggestion.id ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {/* Expanded Content */}
            {expandedId === suggestion.id && (
              <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-3">
                  {suggestion.description}
                </p>
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {isSwahili ? 'Maneno Yanayopendekezwa:' : 'Suggested Phrases:'}
                  </p>
                  
                  {(isSwahili ? suggestion.suggestedPhrasesSw : suggestion.suggestedPhrases).map((phrase, index) => (
                    <button
                      key={index}
                      onClick={() => copyPhrase(phrase, `${suggestion.id}-${index}`)}
                      className="w-full flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group text-left"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300 italic">
                        "{phrase}"
                      </span>
                      {copiedId === `${suggestion.id}-${index}` ? (
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Tip */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 {isSwahili 
            ? 'Bofya pendekezo lolote kulikopya'
            : 'Click any phrase to copy it'
          }
        </p>
      </div>
    </div>
  );
};
