import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Call, Customer, TranscriptEntry, CallExtraction, CallHistoryItem, CallSummary } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { generateAISummary } from '../services/geminiService';

interface CallState {
  currentCall: Call | null;
  callHistory: CallHistoryItem[];
  theme: 'light' | 'dark';
  
  // Actions
  startCall: (customer: Customer) => void;
  endCall: (summaryText?: string) => void;
  endCallWithAI: () => Promise<void>;
  cancelCall: () => void;
  toggleMute: () => void;
  addTranscriptEntry: (entry: Omit<TranscriptEntry, 'id'>) => void;
  updateTranscriptEntry: (id: string, text: string, isFinal: boolean) => void;
  updateExtraction: (extraction: Partial<CallExtraction>) => void;
  setSummary: (summary: Omit<CallSummary, 'id' | 'createdAt'>) => void;
  updateCallDuration: (duration: number) => void;
  toggleTheme: () => void;
  clearHistory: () => void;
  getCallById: (id: string) => CallHistoryItem | undefined;
}

const initialExtraction: CallExtraction = {
  promises: [],
  objections: [],
  agreements: [],
  sentiment: 'neutral',
  sentimentScore: 50,
  keyQuotes: [],
  keywords: [],
};

export const useCallStore = create<CallState>()(
  persist(
    (set, get) => ({
      currentCall: null,
      callHistory: [],
      theme: 'light',

      startCall: (customer: Customer) => {
        const newCall: Call = {
          id: uuidv4(),
          customer,
          startedAt: new Date(),
          duration: 0,
          status: 'active',
          transcript: [],
          extraction: { ...initialExtraction },
          isMuted: false,
        };
        set({ currentCall: newCall });
      },

      // Basic end call without AI (fallback)
      endCall: (summaryText?: string) => {
        const { currentCall } = get();
        if (!currentCall) return;

        const endedCall: Call = {
          ...currentCall,
          status: 'completed',
          endedAt: new Date(),
        };

        // Generate basic summary
        const summary = generateBasicCallSummary(endedCall, summaryText);
        endedCall.summary = summary;

        // Get full transcript text
        const fullTranscript = endedCall.transcript.map(t => t.text).join(' ');

        // Add to history
        const historyItem: CallHistoryItem = {
          id: endedCall.id,
          customer: endedCall.customer,
          startedAt: endedCall.startedAt,
          endedAt: endedCall.endedAt!,
          duration: endedCall.duration,
          sentiment: endedCall.extraction.sentiment,
          promisesCount: endedCall.extraction.promises.length,
          totalPromisedAmount: endedCall.extraction.promises.reduce(
            (sum, p) => sum + (p.amount || 0),
            0
          ),
          summary: summary.summaryText,
          fullTranscript,
        };

        set((state) => ({
          currentCall: endedCall,
          callHistory: [historyItem, ...state.callHistory],
        }));
      },

      // End call with AI-powered summary and next actions
      endCallWithAI: async () => {
        const { currentCall } = get();
        if (!currentCall) return;

        const endedCall: Call = {
          ...currentCall,
          status: 'completed',
          endedAt: new Date(),
        };

        // Get full transcript text
        const fullTranscript = endedCall.transcript.map(t => t.text).join(' ');

        try {
          // Use Gemini AI to generate summary and next actions
          const aiResult = await generateAISummary(
            fullTranscript,
            endedCall.customer.name,
            endedCall.customer.debtAmount,
            endedCall.duration,
            {
              promises: endedCall.extraction.promises,
              objections: endedCall.extraction.objections,
              agreements: endedCall.extraction.agreements,
              sentiment: endedCall.extraction.sentiment,
            }
          );

          const summary: CallSummary = {
            id: uuidv4(),
            callId: endedCall.id,
            summaryText: aiResult.summary,
            nextActions: aiResult.nextActions,
            createdAt: new Date(),
          };

          endedCall.summary = summary;

          // Add to history
          const historyItem: CallHistoryItem = {
            id: endedCall.id,
            customer: endedCall.customer,
            startedAt: endedCall.startedAt,
            endedAt: endedCall.endedAt!,
            duration: endedCall.duration,
            sentiment: endedCall.extraction.sentiment,
            promisesCount: endedCall.extraction.promises.length,
            totalPromisedAmount: endedCall.extraction.promises.reduce(
              (sum, p) => sum + (p.amount || 0),
              0
            ),
            summary: summary.summaryText,
            fullTranscript,
          };

          set((state) => ({
            currentCall: endedCall,
            callHistory: [historyItem, ...state.callHistory],
          }));

        } catch (error) {
          console.error('AI summary failed, using fallback:', error);
          // Fall back to basic summary
          get().endCall();
        }
      },

      cancelCall: () => {
        set({ currentCall: null });
      },

      toggleMute: () => {
        set((state) => ({
          currentCall: state.currentCall
            ? { ...state.currentCall, isMuted: !state.currentCall.isMuted }
            : null,
        }));
      },

      addTranscriptEntry: (entry) => {
        set((state) => ({
          currentCall: state.currentCall
            ? {
                ...state.currentCall,
                transcript: [
                  ...state.currentCall.transcript,
                  { ...entry, id: uuidv4() },
                ],
              }
            : null,
        }));
      },

      updateTranscriptEntry: (id, text, isFinal) => {
        set((state) => {
          if (!state.currentCall) return state;
          
          const transcript = state.currentCall.transcript.map((t) =>
            t.id === id ? { ...t, text, isFinal } : t
          );

          return {
            currentCall: {
              ...state.currentCall,
              transcript,
            },
          };
        });
      },

      updateExtraction: (extraction) => {
        set((state) => {
          if (!state.currentCall) return state;
          
          const currentExtraction = state.currentCall.extraction;
          const newExtraction: CallExtraction = {
            promises: extraction.promises 
              ? [...currentExtraction.promises, ...extraction.promises]
              : currentExtraction.promises,
            objections: extraction.objections
              ? [...currentExtraction.objections, ...extraction.objections]
              : currentExtraction.objections,
            agreements: extraction.agreements
              ? [...currentExtraction.agreements, ...extraction.agreements]
              : currentExtraction.agreements,
            sentiment: extraction.sentiment ?? currentExtraction.sentiment,
            sentimentScore: extraction.sentimentScore ?? currentExtraction.sentimentScore,
            keyQuotes: extraction.keyQuotes
              ? [...currentExtraction.keyQuotes, ...extraction.keyQuotes]
              : currentExtraction.keyQuotes,
            keywords: extraction.keywords
              ? [...new Set([...currentExtraction.keywords, ...extraction.keywords])]
              : currentExtraction.keywords,
          };

          return {
            currentCall: {
              ...state.currentCall,
              extraction: newExtraction,
            },
          };
        });
      },

      setSummary: (summaryData) => {
        set((state) => ({
          currentCall: state.currentCall
            ? {
                ...state.currentCall,
                summary: {
                  id: uuidv4(),
                  ...summaryData,
                  createdAt: new Date(),
                },
              }
            : null,
        }));
      },

      updateCallDuration: (duration) => {
        set((state) => ({
          currentCall: state.currentCall
            ? { ...state.currentCall, duration }
            : null,
        }));
      },

      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        }));
      },

      clearHistory: () => {
        set({ callHistory: [] });
      },

      getCallById: (id) => {
        return get().callHistory.find((call) => call.id === id);
      },
    }),
    {
      name: 'call-notes-storage',
      partialize: (state) => ({
        callHistory: state.callHistory,
        theme: state.theme,
      }),
    }
  )
);

// Basic summary generator (fallback when AI fails)
function generateBasicCallSummary(call: Call, customSummary?: string): CallSummary {
  const { customer, extraction, duration } = call;
  const { promises, objections, agreements, sentiment } = extraction;

  let summaryParts: string[] = [];

  if (customSummary) {
    summaryParts.push(customSummary);
  } else {
    // Opening
    summaryParts.push(
      `Call with ${customer.name} (Account: ${customer.accountNumber}) lasted ${formatDuration(duration)}.`
    );

    // Sentiment and overall tone
    const sentimentText = {
      positive: 'The conversation was cooperative and constructive',
      neutral: 'The conversation maintained a neutral tone',
      negative: 'The conversation included some concerns or resistance',
    };
    summaryParts.push(sentimentText[sentiment] + '.');

    // Objections
    if (objections.length > 0) {
      const objectionTypes = [...new Set(objections.map((o) => o.type.replace('_', ' ')))].join(', ');
      summaryParts.push(`Issues raised: ${objectionTypes}.`);
    }

    // Promises
    if (promises.length > 0) {
      const totalAmount = promises.reduce((sum, p) => sum + (p.amount || 0), 0);
      if (totalAmount > 0) {
        summaryParts.push(`Payment commitment: KES ${new Intl.NumberFormat('en-KE').format(totalAmount)}.`);
      }
    }

    // Agreements
    if (agreements.length > 0) {
      const agreementTypes = [...new Set(agreements.map((a) => a.type.replace('_', ' ')))].join(', ');
      summaryParts.push(`Agreements: ${agreementTypes}.`);
    }
  }

  // Generate context-aware next actions
  const nextActions = generateContextAwareNextActions(call);

  return {
    id: uuidv4(),
    callId: call.id,
    summaryText: summaryParts.join(' '),
    nextActions,
    createdAt: new Date(),
  };
}

// Generate next actions based on actual conversation content
function generateContextAwareNextActions(call: Call): string[] {
  const actions: string[] = [];
  const { extraction, customer } = call;
  const fullTranscript = call.transcript.map(t => t.text).join(' ').toLowerCase();

  // Check for specific promises
  if (extraction.promises.length > 0) {
    const totalAmount = extraction.promises.reduce((sum, p) => sum + (p.amount || 0), 0);
    if (totalAmount > 0) {
      actions.push(`Monitor payment of KES ${new Intl.NumberFormat('en-KE').format(totalAmount)} from ${customer.name}`);
    }
    
    // Check for specific dates mentioned
    const promise = extraction.promises[0];
    if (promise.dueDate) {
      actions.push(`Set reminder for payment due ${promise.dueDate}`);
    } else {
      actions.push('Confirm payment date with customer via SMS');
    }
  }

  // Check for M-Pesa mentions
  if (fullTranscript.includes('m-pesa') || fullTranscript.includes('mpesa')) {
    actions.push('Verify M-Pesa payment receipt upon receiving');
  }

  // Check for payment plan discussions
  if (extraction.agreements.some((a) => a.type === 'payment_plan') || 
      fullTranscript.includes('payment plan') || 
      fullTranscript.includes('installment')) {
    actions.push('Prepare payment plan documentation and send to customer');
  }

  // Check for callback requests
  if (extraction.agreements.some((a) => a.type === 'callback') ||
      fullTranscript.includes('call back') || 
      fullTranscript.includes('call me')) {
    actions.push('Schedule follow-up call as agreed with customer');
  }

  // Handle objections
  if (extraction.objections.some((o) => o.type === 'job_loss' || o.type === 'financial_hardship')) {
    actions.push('Review account for hardship assistance options');
    actions.push('Send information about flexible payment programs');
  }

  if (extraction.objections.some((o) => o.type === 'medical')) {
    actions.push('Flag account for medical hardship review');
  }

  if (extraction.objections.some((o) => o.type === 'dispute')) {
    actions.push('Escalate account dispute to supervisor for investigation');
    actions.push('Send account statement and transaction history to customer');
  }

  // Check for document requests
  if (fullTranscript.includes('statement') || fullTranscript.includes('document')) {
    actions.push('Email account statement to customer');
  }

  // Handle negative sentiment
  if (extraction.sentiment === 'negative') {
    actions.push('Consider supervisor follow-up call to address concerns');
  }

  // Default actions if nothing specific found
  if (actions.length === 0) {
    if (fullTranscript.length > 50) {
      actions.push(`Follow up with ${customer.name} within 7 days`);
      actions.push('Send account reminder via SMS');
    } else {
      actions.push('Attempt callback - conversation was brief');
      actions.push('Review account for alternative contact methods');
    }
  }

  // Limit to 5 most relevant actions
  return actions.slice(0, 5);
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} seconds`;
  return `${mins} minute${mins > 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`;
}
