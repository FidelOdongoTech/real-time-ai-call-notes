import { useEffect, useRef } from 'react';
import { MessageSquare, User, Mic, AlertCircle } from 'lucide-react';
import type { TranscriptEntry } from '../types';
import { cn } from '../utils/cn';

interface TranscriptPanelProps {
  transcript: TranscriptEntry[];
  isActive: boolean;
  interimText?: string;
  error?: string | null;
}

export function TranscriptPanel({ transcript, isActive, interimText, error }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, interimText]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Live Transcription</h3>
        </div>
        {isActive && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Listening
          </span>
        )}
      </div>

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Microphone Error</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[500px]">
        {transcript.length === 0 && !interimText ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <Mic className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm text-center">
              {isActive 
                ? 'Listening... Start speaking into your microphone' 
                : 'Click "Start Recording" to begin transcription'}
            </p>
            {isActive && (
              <p className="text-xs mt-2 text-gray-400">
                Speak clearly for best results
              </p>
            )}
          </div>
        ) : (
          <>
            {transcript.map((entry) => (
              <TranscriptMessage key={entry.id} entry={entry} />
            ))}
            
            {/* Interim text (currently being spoken) */}
            {interimText && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                  <Mic className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 block">
                    Listening...
                  </span>
                  <div className="inline-block p-3 rounded-xl rounded-tl-none text-sm bg-blue-50 dark:bg-blue-900/30 text-gray-600 dark:text-gray-400 italic">
                    {interimText}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function TranscriptMessage({ entry }: { entry: TranscriptEntry }) {
  // Highlight keywords in text
  const highlightText = (text: string) => {
    // Keywords to highlight (including KES for Kenyan Shillings)
    const amountRegex = /(?:KES|Ksh|Kshs?)[\s]*[\d,]+(?:\.\d{2})?|\b\d+(?:,\d{3})*\s*(?:shillings?|bob)/gi;
    const promiseKeywords = /\b(promise|will pay|commit|agree|payment plan)\b/gi;
    const dateKeywords = /\b(today|tomorrow|next week|monday|tuesday|wednesday|thursday|friday|by the \d+(?:st|nd|rd|th)?)\b/gi;

    let result = text;
    
    // Find all matches and their positions
    const highlights: { start: number; end: number; type: string; text: string }[] = [];

    let match;
    while ((match = amountRegex.exec(text)) !== null) {
      highlights.push({ start: match.index, end: match.index + match[0].length, type: 'amount', text: match[0] });
    }
    while ((match = promiseKeywords.exec(text)) !== null) {
      highlights.push({ start: match.index, end: match.index + match[0].length, type: 'promise', text: match[0] });
    }
    while ((match = dateKeywords.exec(text)) !== null) {
      highlights.push({ start: match.index, end: match.index + match[0].length, type: 'date', text: match[0] });
    }

    if (highlights.length === 0) return text;

    // Sort by position and create spans
    highlights.sort((a, b) => a.start - b.start);
    
    const parts: React.ReactNode[] = [];
    let lastEnd = 0;

    highlights.forEach((h, i) => {
      if (h.start > lastEnd) {
        parts.push(result.slice(lastEnd, h.start));
      }
      if (h.start >= lastEnd) {
        parts.push(
          <span
            key={i}
            className={cn(
              'px-1 rounded font-medium',
              h.type === 'amount' && 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
              h.type === 'date' && 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
              h.type === 'promise' && 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
            )}
          >
            {h.text}
          </span>
        );
        lastEnd = h.end;
      }
    });

    if (lastEnd < result.length) {
      parts.push(result.slice(lastEnd));
    }

    return parts;
  };

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
        <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Speaker
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(entry.timestamp).toLocaleTimeString()}
          </span>
          {!entry.isFinal && (
            <span className="text-xs text-yellow-600 dark:text-yellow-400 italic">
              (processing...)
            </span>
          )}
        </div>
        <div
          className={cn(
            'inline-block p-3 rounded-xl rounded-tl-none text-sm',
            entry.isFinal
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400'
          )}
        >
          {highlightText(entry.text)}
        </div>
      </div>
    </div>
  );
}
