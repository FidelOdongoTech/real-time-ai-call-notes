// Groq Fallback AI Service - Uses Groq's OpenAI-compatible chat API
// Falls back when Gemini is unavailable

const GROQ_API_KEY = import.meta.env.VITE_GROQ_FALLBACK_KEY || import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama3-70b-8192';

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

interface ConversationContext {
  customerName: string;
  debtAmount: number;
  transcript: string;
  lastStatement: string;
  detectedSentiment: 'positive' | 'neutral' | 'negative';
  language: 'en-KE' | 'sw-KE';
}

async function callGroqChat(messages: { role: string; content: string }[]): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function cleanJsonResponse(text: string): string {
  return text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .replace(/^[^{]*/, '')
    .replace(/[^}]*$/, '')
    .trim();
}

export async function groqCoachingSuggestions(context: ConversationContext): Promise<CoachingSuggestion[]> {
  const systemPrompt = `You are an AI assistant helping a debt collection agent in Kenya. Analyze the conversation and provide real-time coaching suggestions. Respond with ONLY valid JSON.`;
  
  const userPrompt = `Analyze this debt collection conversation and provide 1-2 coaching suggestions.

CONTEXT:
- Customer: ${context.customerName || 'Customer'}
- Debt: KES ${context.debtAmount?.toLocaleString() || 'Unknown'}
- Sentiment: ${context.detectedSentiment}
- Language: ${context.language === 'sw-KE' ? 'Swahili' : 'English'}

CONVERSATION:
${context.transcript}

Respond with ONLY this JSON:
{"suggestions":[{"type":"empathy","priority":"important","title":"Show Understanding","titleSw":"Onyesha Uelewa","description":"Brief description","suggestedPhrases":["English phrase"],"suggestedPhrasesSw":["Swahili phrase"]}]}

Types: de_escalation, empathy, objection_handling, closing, rapport, verification
Priority: urgent, important, normal`;

  try {
    const responseText = await callGroqChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const cleanText = cleanJsonResponse(responseText);
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return (parsed.suggestions || []).map((s: any, index: number) => ({
        id: `groq-${Date.now()}-${index}`,
        type: s.type || 'general',
        priority: s.priority || 'normal',
        title: s.title || 'Suggestion',
        titleSw: s.titleSw || s.title || 'Pendekezo',
        description: s.description || '',
        suggestedPhrases: s.suggestedPhrases || [],
        suggestedPhrasesSw: s.suggestedPhrasesSw || s.suggestedPhrases || [],
      }));
    }

    throw new Error('Could not parse Groq coaching response');
  } catch (error) {
    console.error('Groq coaching error:', error);
    throw error;
  }
}

export async function groqGenerateSummary(
  transcript: string,
  customerName: string,
  debtAmount: number,
  duration: number,
  extractions: { promises: any[]; objections: any[]; agreements: any[]; sentiment: string }
): Promise<{ summary: string; nextActions: string[] }> {
  const systemPrompt = `You are a debt collection call analyst. Generate concise summaries with specific next actions. Respond with ONLY valid JSON.`;

  const userPrompt = `Summarize this debt collection call.

CALL DETAILS:
- Customer: ${customerName}
- Debt: KES ${debtAmount?.toLocaleString()}
- Duration: ${Math.floor(duration / 60)}m ${duration % 60}s
- Sentiment: ${extractions.sentiment}
- Promises: ${extractions.promises.length}
- Objections: ${extractions.objections.length}
- Agreements: ${extractions.agreements.length}

TRANSCRIPT:
${transcript}

Respond with ONLY this JSON:
{"summary":"2-3 sentence professional summary...","nextActions":["Specific action 1","Specific action 2","Specific action 3"]}

Make actions SPECIFIC like "Follow up on KES 5,000 payment promised for Friday via M-Pesa" not generic like "Follow up later".`;

  try {
    const responseText = await callGroqChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const cleanText = cleanJsonResponse(responseText);
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || 'Call completed.',
        nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions.slice(0, 5) : [],
      };
    }

    throw new Error('Could not parse Groq summary response');
  } catch (error) {
    console.error('Groq summary error:', error);
    throw error;
  }
}

export function resetGroqCache() {
  // No cache to reset for Groq
}
