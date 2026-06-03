import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
    <div className="bg-white dark:bg-slate-800 rounded-lg flex flex-col h-full min-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Live Transcription</h3>
          {isActive && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded">
              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Live</span>
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
          {transcript.length} utterances
        </span>
      </div>

      {error && (
        <div className="mx-4 mt-3 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/50 rounded-md flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-red-700 dark:text-red-300">Microphone Error</p>
            <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {transcript.length === 0 && !interimText ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
            <Mic className="w-10 h-10 mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-center leading-relaxed max-w-xs">
              {isActive 
                ? 'Listening... Start speaking into your microphone' 
                : 'Click "Start Recording" to begin transcription'}
            </p>
          </div>
        ) : (
          <>
            {transcript.map((entry) => (
              <TranscriptMessage key={entry.id} entry={entry} />
            ))}
            
            {interimText && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <Mic className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="flex-1">
                  <span className="text-[11px] font-medium text-slate-400 mb-0.5 block">Listening...</span>
                  <div className="inline-block p-2.5 rounded-lg rounded-tl-none text-xs bg-slate-100 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 italic">
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
  const highlightText = (text: string) => {
    const amountRegex = /(?:KES|Ksh|Kshs?)[\s]*[\d,]+(?:\.\d{2})?|\b\d+(?:,\d{3})*\s*(?:shillings?|bob)/gi;
    const promiseKeywords = /\b(promise|will pay|commit|agree|payment plan)\b/gi;
    const dateKeywords = /\b(today|tomorrow|next week|monday|tuesday|wednesday|thursday|friday|by the \d+(?:st|nd|rd|th)?)\b/gi;

    let result = text;
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
              h.type === 'amount' && 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
              h.type === 'date' && 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
              h.type === 'promise' && 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-2.5 group"
    >
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
        entry.speaker === 'customer' ? 'bg-sky-100 dark:bg-sky-900/30' : 'bg-slate-100 dark:bg-slate-700'
      )}>
        <User className={cn(
          'w-3.5 h-3.5',
          entry.speaker === 'customer' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500'
        )} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn(
            'text-[11px] font-medium',
            entry.speaker === 'customer'
              ? 'text-sky-600 dark:text-sky-400'
              : 'text-slate-500 dark:text-slate-400'
          )}>
            {entry.speaker === 'customer' ? 'Customer' : 'Agent'}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
            {new Date(entry.timestamp).toLocaleTimeString()}
          </span>
          {!entry.isFinal && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 italic">processing...</span>
          )}
        </div>
        <div
          className={cn(
            'inline-block p-2.5 rounded-lg rounded-tl-none text-xs leading-relaxed',
            entry.isFinal
              ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
              : 'bg-slate-50 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400'
          )}
        >
          {highlightText(entry.text)}
        </div>
      </div>
    </motion.div>
  );
}
