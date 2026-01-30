// Gemini AI Service - Using REST API for better browser compatibility
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

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

// Cache to avoid too many API calls
let lastAnalyzedLength = 0;
let lastSuggestions: CoachingSuggestion[] = [];
let isProcessing = false;

async function callGeminiAPI(prompt: string): Promise<string> {
  console.log('📡 Calling Gemini API...');
  
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Gemini API error:', response.status, errorText);
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ Gemini API response received:', data);
  
  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }
  
  throw new Error('Invalid response structure from Gemini');
}

function cleanJsonResponse(text: string): string {
  let cleanText = text.trim();
  
  // Remove markdown code blocks
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.slice(7);
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.slice(3);
  }
  
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.slice(0, -3);
  }
  
  return cleanText.trim();
}

export async function getAICoachingSuggestions(context: ConversationContext): Promise<CoachingSuggestion[]> {
  console.log('🎯 getAICoachingSuggestions called, transcript length:', context.transcript.length);
  
  // Avoid duplicate calls while processing
  if (isProcessing) {
    console.log('⏳ Already processing, returning cached suggestions');
    return lastSuggestions;
  }

  // Need at least some content
  if (context.transcript.length < 15) {
    console.log('📝 Transcript too short, returning empty');
    return [];
  }

  // Only call API if transcript has changed significantly (every 60 chars)
  if (context.transcript.length - lastAnalyzedLength < 60) {
    console.log('📋 Not enough new content, returning cached suggestions');
    return lastSuggestions;
  }

  isProcessing = true;

  try {
    const prompt = `You are an AI assistant helping a debt collection agent in Kenya. Analyze this conversation and provide real-time coaching suggestions.

CONTEXT:
- Customer Name: ${context.customerName || 'Customer'}
- Debt Amount: KES ${context.debtAmount?.toLocaleString() || 'Unknown'}
- Current Sentiment: ${context.detectedSentiment}
- Language: ${context.language === 'sw-KE' ? 'Swahili' : 'English'}

CONVERSATION:
${context.transcript}

Provide 1-2 coaching suggestions for the agent based on this conversation.

Respond with ONLY this JSON structure (no markdown, no explanation):
{"suggestions":[{"type":"empathy","priority":"important","title":"Show Understanding","titleSw":"Onyesha Uelewa","description":"Brief description","suggestedPhrases":["English phrase 1","English phrase 2"],"suggestedPhrasesSw":["Swahili phrase 1","Swahili phrase 2"]}]}

Types: de_escalation, empathy, objection_handling, closing, rapport, verification, general
Priority: urgent, important, normal`;

    const responseText = await callGeminiAPI(prompt);
    const cleanText = cleanJsonResponse(responseText);
    
    console.log('🔍 Cleaned response:', cleanText);

    // Try to parse JSON
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const suggestions: CoachingSuggestion[] = (parsed.suggestions || []).map((s: any, index: number) => ({
        id: `ai-${Date.now()}-${index}`,
        type: s.type || 'general',
        priority: s.priority || 'normal',
        title: s.title || 'Suggestion',
        titleSw: s.titleSw || s.title || 'Pendekezo',
        description: s.description || '',
        suggestedPhrases: s.suggestedPhrases || [],
        suggestedPhrasesSw: s.suggestedPhrasesSw || s.suggestedPhrases || []
      }));

      lastAnalyzedLength = context.transcript.length;
      lastSuggestions = suggestions;
      isProcessing = false;
      
      console.log('✅ AI Suggestions generated:', suggestions.length);
      return suggestions;
    }

    throw new Error('Could not parse JSON from response');
  } catch (error) {
    console.error('❌ Gemini coaching error:', error);
    isProcessing = false;
    
    // Return fallback suggestions based on keyword matching
    const fallback = getFallbackSuggestions(context);
    lastSuggestions = fallback;
    lastAnalyzedLength = context.transcript.length;
    return fallback;
  }
}

// Fallback suggestions when API fails
function getFallbackSuggestions(context: ConversationContext): CoachingSuggestion[] {
  console.log('🔄 Using fallback suggestions');
  const suggestions: CoachingSuggestion[] = [];
  const lowerTranscript = context.transcript.toLowerCase();

  // Check for upset customer
  if (context.detectedSentiment === 'negative' || 
      /angry|frustrated|upset|ridiculous|terrible|hate|hasira|chuki/.test(lowerTranscript)) {
    suggestions.push({
      id: 'fallback-deescalate',
      type: 'de_escalation',
      priority: 'urgent',
      title: '🚨 Calm the Situation',
      titleSw: '🚨 Tuliza Hali',
      description: 'Customer seems upset. Use calming language and acknowledge their feelings.',
      suggestedPhrases: [
        'I completely understand your frustration, and I apologize for any inconvenience.',
        'Let me see what I can do to help resolve this for you today.',
        'Your concerns are absolutely valid. Let\'s work through this together.'
      ],
      suggestedPhrasesSw: [
        'Naelewa kabisa wasiwasi wako, naomba msamaha kwa usumbufu wowote.',
        'Wacha nione ninachoweza kufanya kukusaidia leo.',
        'Wasiwasi wako ni halali. Tufanye kazi pamoja.'
      ]
    });
  }

  // Check for financial hardship
  if (/no money|can't afford|struggling|broke|sina pesa|hali ngumu|shida/.test(lowerTranscript)) {
    suggestions.push({
      id: 'fallback-hardship',
      type: 'empathy',
      priority: 'important',
      title: '💚 Show Empathy for Hardship',
      titleSw: '💚 Onyesha Huruma',
      description: 'Customer mentioned financial difficulties. Offer understanding and flexible options.',
      suggestedPhrases: [
        'I understand times are tough. We have flexible payment plans available.',
        'Would a smaller monthly payment work better for your situation?',
        'We want to help you through this difficult time.'
      ],
      suggestedPhrasesSw: [
        'Naelewa wakati ni mgumu. Tuna mipango ya malipo inayonyumbulika.',
        'Je, malipo madogo ya kila mwezi yangekufaa zaidi?',
        'Tunataka kukusaidia kupitia wakati huu mgumu.'
      ]
    });
  }

  // Check for job loss
  if (/lost job|no job|fired|unemployed|sina kazi|nimefukuzwa|kupoteza kazi/.test(lowerTranscript)) {
    suggestions.push({
      id: 'fallback-jobloss',
      type: 'empathy',
      priority: 'important',
      title: '💼 Acknowledge Job Loss',
      titleSw: '💼 Kubali Kupoteza Kazi',
      description: 'Customer mentioned unemployment. Show empathy and offer hardship programs.',
      suggestedPhrases: [
        'I\'m sorry to hear about your job situation. That must be really stressful.',
        'We have a hardship program that might help. Can I tell you about it?',
        'Let\'s find a solution that works while you get back on your feet.'
      ],
      suggestedPhrasesSw: [
        'Pole sana kusikia kuhusu hali yako ya kazi. Lazima ni vigumu.',
        'Tuna mpango wa msaada ambao unaweza kusaidia. Nikueleze?',
        'Tupate suluhisho linaloufaa wakati unajirekebisha.'
      ]
    });
  }

  // Check for promise/agreement
  if (/will pay|i'll pay|promise|nitalipa|nitakulipa|ahadi|nakubali/.test(lowerTranscript)) {
    suggestions.push({
      id: 'fallback-closing',
      type: 'closing',
      priority: 'important',
      title: '✅ Confirm the Commitment',
      titleSw: '✅ Thibitisha Ahadi',
      description: 'Customer is willing to pay. Confirm the details and secure the commitment.',
      suggestedPhrases: [
        `Great! Just to confirm, you'll pay the amount by what date?`,
        'Shall I send you the M-Pesa Paybill details right now?',
        'I\'ll note this commitment in your account. Thank you!'
      ],
      suggestedPhrasesSw: [
        'Vizuri! Kwa kuthibitisha, utalipa kiasi hicho tarehe gani?',
        'Nikutumie maelezo ya M-Pesa Paybill sasa hivi?',
        'Nitaandika ahadi hii kwenye akaunti yako. Asante!'
      ]
    });
  }

  // Check for M-Pesa mention
  if (/m-pesa|mpesa|lipa|transfer|paybill/.test(lowerTranscript)) {
    suggestions.push({
      id: 'fallback-mpesa',
      type: 'verification',
      priority: 'normal',
      title: '📱 Verify M-Pesa Details',
      titleSw: '📱 Thibitisha M-Pesa',
      description: 'M-Pesa mentioned. Ensure payment details are clear.',
      suggestedPhrases: [
        'Our M-Pesa Paybill number is XXXXXX. Account number is your phone number.',
        'Please send the confirmation message once you\'ve made the payment.',
        'I can wait while you make the transfer if you\'d like.'
      ],
      suggestedPhrasesSw: [
        'Nambari yetu ya M-Pesa Paybill ni XXXXXX. Nambari ya akaunti ni nambari yako ya simu.',
        'Tafadhali tuma ujumbe wa kuthibitisha ukimaliza kulipa.',
        'Ninaweza kusubiri unapo fanya uhamisho.'
      ]
    });
  }

  // Default suggestion if nothing matched
  if (suggestions.length === 0) {
    suggestions.push({
      id: 'fallback-default',
      type: 'rapport',
      priority: 'normal',
      title: '🤝 Build Connection',
      titleSw: '🤝 Jenga Uhusiano',
      description: 'Start with empathy and understand the customer\'s situation.',
      suggestedPhrases: [
        'How are you doing today? I hope I\'m not catching you at a bad time.',
        'I\'m here to help find a solution that works for both of us.',
        'Can you tell me a bit about what\'s been going on?'
      ],
      suggestedPhrasesSw: [
        'Habari yako leo? Natumai sijakupata wakati mbaya.',
        'Niko hapa kusaidia kupata suluhisho linalofaa sisi sote.',
        'Unaweza kunieleza kidogo kuhusu kinachotokea?'
      ]
    });
  }

  return suggestions;
}

// Generate AI-powered call summary with SPECIFIC next actions
export async function generateAISummary(
  transcript: string,
  customerName: string,
  debtAmount: number,
  duration: number,
  existingExtractions: {
    promises: any[];
    objections: any[];
    agreements: any[];
    sentiment: string;
  }
): Promise<{
  summary: string;
  nextActions: string[];
}> {
  console.log('📝 Generating AI Summary...');
  
  if (!transcript || transcript.length < 10) {
    return {
      summary: 'Session completed with minimal conversation.',
      nextActions: ['Schedule follow-up call', 'Review account status']
    };
  }

  try {
    const prompt = `Analyze this debt collection call from Kenya and generate a summary with SPECIFIC next actions.

CALL DETAILS:
- Customer: ${customerName}
- Debt: KES ${debtAmount?.toLocaleString()}
- Duration: ${Math.floor(duration / 60)}m ${duration % 60}s
- Sentiment: ${existingExtractions.sentiment}

EXTRACTED DATA:
- Promises: ${existingExtractions.promises.length > 0 ? JSON.stringify(existingExtractions.promises) : 'None'}
- Objections: ${existingExtractions.objections.length > 0 ? JSON.stringify(existingExtractions.objections) : 'None'}  
- Agreements: ${existingExtractions.agreements.length > 0 ? JSON.stringify(existingExtractions.agreements) : 'None'}

TRANSCRIPT:
${transcript}

Generate a JSON response with:
1. A 2-3 sentence professional summary
2. 3-5 SPECIFIC next actions based on what was actually discussed

Respond with ONLY this JSON (no markdown):
{"summary":"Professional summary of the call...","nextActions":["Specific action 1","Specific action 2","Specific action 3"]}

Make actions SPECIFIC like:
- "Follow up on KES 5,000 payment promised for Friday via M-Pesa"
- "Send hardship program details to customer's phone"
- "Escalate disputed charges to supervisor for review"

NOT generic like "Follow up later" or "Review call"`;

    const responseText = await callGeminiAPI(prompt);
    const cleanText = cleanJsonResponse(responseText);
    
    console.log('📋 Summary response:', cleanText);

    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ AI Summary generated successfully');
      return {
        summary: parsed.summary || 'Call completed.',
        nextActions: parsed.nextActions || generateFallbackNextActions(customerName, debtAmount, existingExtractions)
      };
    }

    throw new Error('Failed to parse summary response');
  } catch (error) {
    console.error('❌ Gemini summary error:', error);
    
    // Return fallback summary
    return generateFallbackSummary(customerName, debtAmount, transcript, existingExtractions);
  }
}

function generateFallbackNextActions(
  customerName: string,
  debtAmount: number,
  extractions: { promises: any[]; objections: any[]; agreements: any[]; sentiment: string }
): string[] {
  const actions: string[] = [];

  if (extractions.promises.length > 0) {
    const promise = extractions.promises[0];
    if (promise.amount) {
      actions.push(`Monitor KES ${promise.amount.toLocaleString()} payment from ${customerName}`);
    } else {
      actions.push(`Follow up on payment commitment from ${customerName}`);
    }
    actions.push('Send M-Pesa payment details via SMS');
  }

  if (extractions.objections.some(o => o.type === 'financial_hardship' || o.type === 'job_loss')) {
    actions.push('Review account for hardship assistance program eligibility');
  }

  if (extractions.objections.some(o => o.type === 'dispute')) {
    actions.push('Escalate account dispute to supervisor for investigation');
  }

  if (extractions.agreements.some(a => a.type === 'payment_plan')) {
    actions.push('Prepare payment plan documentation and send to customer');
  }

  if (extractions.agreements.some(a => a.type === 'callback')) {
    actions.push('Schedule callback as agreed with customer');
  }

  if (extractions.sentiment === 'negative') {
    actions.push('Consider assigning senior agent for follow-up due to customer concerns');
  }

  if (actions.length === 0) {
    actions.push(`Schedule follow-up call with ${customerName} within 5 business days`);
    actions.push(`Send account statement showing KES ${debtAmount.toLocaleString()} balance`);
  }

  return actions.slice(0, 5);
}

function generateFallbackSummary(
  customerName: string,
  debtAmount: number,
  _transcript: string,
  extractions: { promises: any[]; objections: any[]; agreements: any[]; sentiment: string }
): { summary: string; nextActions: string[] } {
  console.log('🔄 Using fallback summary generation');
  
  const parts: string[] = [];
  parts.push(`Call with ${customerName} regarding outstanding balance of KES ${debtAmount.toLocaleString()}.`);

  if (extractions.promises.length > 0) {
    const totalAmount = extractions.promises.reduce((sum, p) => sum + (p.amount || 0), 0);
    if (totalAmount > 0) {
      parts.push(`Customer committed to pay KES ${totalAmount.toLocaleString()}.`);
    } else {
      parts.push('Customer indicated willingness to make payment.');
    }
  } else if (extractions.objections.length > 0) {
    const types = extractions.objections.map(o => o.type).filter(Boolean);
    if (types.includes('financial_hardship')) {
      parts.push('Customer expressed financial difficulties and may need flexible payment options.');
    } else if (types.includes('job_loss')) {
      parts.push('Customer mentioned job loss situation.');
    } else if (types.includes('dispute')) {
      parts.push('Customer disputed the debt and requested verification.');
    }
  } else {
    parts.push('Discussion focused on account status and payment options.');
  }

  const sentimentText = {
    positive: 'Call ended on a positive note with good cooperation.',
    neutral: 'Customer remained neutral throughout the conversation.',
    negative: 'Customer expressed concerns that may need follow-up.'
  };
  parts.push(sentimentText[extractions.sentiment as keyof typeof sentimentText] || '');

  return {
    summary: parts.filter(Boolean).join(' '),
    nextActions: generateFallbackNextActions(customerName, debtAmount, extractions)
  };
}

export function resetCoachingCache() {
  lastAnalyzedLength = 0;
  lastSuggestions = [];
  isProcessing = false;
  console.log('🔄 Coaching cache reset');
}
