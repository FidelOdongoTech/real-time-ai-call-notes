export interface Customer {
  name: string;
  phone: string;
  accountNumber: string;
  debtAmount: number;
}

export interface TranscriptEntry {
  id: string;
  speaker: 'agent' | 'customer' | 'user';
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export interface Promise {
  id: string;
  amount?: number;
  dueDate?: string;
  description: string;
  timestamp: number;
}

export interface Objection {
  id: string;
  type: 'financial_hardship' | 'job_loss' | 'medical' | 'dispute' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
}

export interface Agreement {
  id: string;
  type: 'payment_plan' | 'settlement' | 'callback' | 'documentation' | 'other';
  details: string;
  timestamp: number;
}

export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface CallExtraction {
  promises: Promise[];
  objections: Objection[];
  agreements: Agreement[];
  sentiment: Sentiment;
  sentimentScore: number;
  keyQuotes: string[];
  keywords: string[];
}

export interface CallSummary {
  id: string;
  callId: string;
  summaryText: string;
  nextActions: string[];
  createdAt: Date;
}

export interface Call {
  id: string;
  customer: Customer;
  startedAt: Date;
  endedAt?: Date;
  duration: number;
  status: 'active' | 'completed' | 'cancelled';
  transcript: TranscriptEntry[];
  extraction: CallExtraction;
  summary?: CallSummary;
  isMuted: boolean;
}

export interface CallHistoryItem {
  id: string;
  customer: Customer;
  startedAt: Date;
  endedAt: Date;
  duration: number;
  sentiment: Sentiment;
  promisesCount: number;
  totalPromisedAmount: number;
  summary?: string;
  fullTranscript?: string;
}

// Speech Recognition Types
export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}
