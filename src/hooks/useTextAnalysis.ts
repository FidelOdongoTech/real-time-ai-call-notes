import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { CallExtraction, Promise, Objection, Agreement, Sentiment } from '../types';

// Keywords for extraction (English + Swahili)
const PROMISE_KEYWORDS = [
  // English
  'promise', 'will pay', 'commit', 'guarantee', 'agree to pay', 'i\'ll pay', 'going to pay', 'can pay',
  // Swahili
  'naahidi', 'nitakulipa', 'nitalipa', 'nitafanya', 'nakubali kulipa', 'nitaweza kulipa', 'naweza kulipa'
];
const OBJECTION_KEYWORDS = [
  // English
  'can\'t afford', 'don\'t have', 'lost job', 'unemployed', 'medical', 'hospital', 'sick', 'hardship', 'difficult', 'dispute', 'not my debt', 'wrong',
  // Swahili
  'sina pesa', 'siwezi', 'nimefukuzwa kazi', 'sina kazi', 'mgonjwa', 'hospitali', 'ugumu', 'siyo deni langu', 'si yangu', 'nimeshindwa'
];
const AGREEMENT_KEYWORDS = [
  // English
  'agree', 'deal', 'accept', 'okay', 'fine', 'will do', 'sounds good', 'let\'s do', 'payment plan',
  // Swahili
  'sawa', 'nakubali', 'ndiyo', 'tutafanya', 'mpango wa malipo', 'nimekubali', 'ni sawa'
];
const POSITIVE_KEYWORDS = [
  // English
  'thank', 'appreciate', 'helpful', 'understand', 'great', 'good', 'excellent', 'wonderful', 'happy',
  // Swahili
  'asante', 'nashukuru', 'nzuri', 'vizuri', 'naelewa', 'furaha', 'bora'
];
const NEGATIVE_KEYWORDS = [
  // English
  'angry', 'frustrated', 'upset', 'unfair', 'ridiculous', 'terrible', 'hate', 'worst', 'awful',
  // Swahili
  'hasira', 'sijaelewa', 'mbaya', 'dhuluma', 'sichuki', 'chuki', 'vibaya sana'
];

// Amount extraction regex (supports KES for Kenyan Shillings)
const AMOUNT_REGEX = /(?:KES|Ksh|Kshs?)[\s]*[\d,]+(?:\.\d{2})?|\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:shillings?|bob)/gi;
const DATE_REGEX = /(?:by|on|before|after)\s+(?:the\s+)?(\d{1,2}(?:st|nd|rd|th)?|\w+)\s*(?:of\s+)?(\w+)?/gi;

interface AnalysisResult {
  extraction: Partial<CallExtraction>;
  hasSignificantContent: boolean;
}

export function useTextAnalysis() {
  const analyzeText = useCallback((text: string, fullTranscript: string): AnalysisResult => {
    const lowerText = text.toLowerCase();
    const extraction: Partial<CallExtraction> = {};
    let hasSignificantContent = false;

    // Extract amounts mentioned (handles KES format)
    const amounts = text.match(AMOUNT_REGEX);
    const extractedAmount = amounts?.[0] ? parseFloat(amounts[0].replace(/[KES|Ksh|Kshs|,\s]/gi, '')) : undefined;

    // Check for promises
    const hasPromise = PROMISE_KEYWORDS.some(kw => lowerText.includes(kw));
    if (hasPromise) {
      const promise: Promise = {
        id: uuidv4(),
        amount: extractedAmount,
        description: text.slice(0, 100),
        timestamp: Date.now(),
      };
      
      // Try to extract date
      const dateMatch = text.match(DATE_REGEX);
      if (dateMatch) {
        promise.dueDate = dateMatch[0];
      }
      
      extraction.promises = [promise];
      hasSignificantContent = true;
    }

    // Check for objections
    const objectionKeyword = OBJECTION_KEYWORDS.find(kw => lowerText.includes(kw));
    if (objectionKeyword) {
      let type: Objection['type'] = 'other';
      let severity: Objection['severity'] = 'medium';

      if (lowerText.includes('job') || lowerText.includes('unemployed')) {
        type = 'job_loss';
        severity = 'high';
      } else if (lowerText.includes('medical') || lowerText.includes('hospital') || lowerText.includes('sick')) {
        type = 'medical';
        severity = 'high';
      } else if (lowerText.includes('afford') || lowerText.includes('hardship')) {
        type = 'financial_hardship';
        severity = 'medium';
      } else if (lowerText.includes('dispute') || lowerText.includes('not my') || lowerText.includes('wrong')) {
        type = 'dispute';
        severity = 'high';
      }

      extraction.objections = [{
        id: uuidv4(),
        type,
        description: text.slice(0, 100),
        severity,
        timestamp: Date.now(),
      }];
      hasSignificantContent = true;
    }

    // Check for agreements
    const hasAgreement = AGREEMENT_KEYWORDS.some(kw => lowerText.includes(kw));
    if (hasAgreement && text.length > 20) {
      let type: Agreement['type'] = 'other';
      
      if (lowerText.includes('payment plan') || lowerText.includes('monthly')) {
        type = 'payment_plan';
      } else if (lowerText.includes('settle') || lowerText.includes('settlement')) {
        type = 'settlement';
      } else if (lowerText.includes('call') || lowerText.includes('callback')) {
        type = 'callback';
      }

      extraction.agreements = [{
        id: uuidv4(),
        type,
        details: text.slice(0, 100),
        timestamp: Date.now(),
      }];
      hasSignificantContent = true;
    }

    // Analyze sentiment
    const positiveCount = POSITIVE_KEYWORDS.filter(kw => lowerText.includes(kw)).length;
    const negativeCount = NEGATIVE_KEYWORDS.filter(kw => lowerText.includes(kw)).length;
    
    // Calculate sentiment based on recent text and full transcript
    const fullLower = fullTranscript.toLowerCase();
    const fullPositive = POSITIVE_KEYWORDS.filter(kw => fullLower.includes(kw)).length;
    const fullNegative = NEGATIVE_KEYWORDS.filter(kw => fullLower.includes(kw)).length;
    
    const totalPositive = positiveCount + fullPositive;
    const totalNegative = negativeCount + fullNegative;
    
    let sentiment: Sentiment = 'neutral';
    let sentimentScore = 50;

    if (totalPositive > totalNegative + 1) {
      sentiment = 'positive';
      sentimentScore = Math.min(95, 50 + (totalPositive - totalNegative) * 15);
    } else if (totalNegative > totalPositive + 1) {
      sentiment = 'negative';
      sentimentScore = Math.max(5, 50 - (totalNegative - totalPositive) * 15);
    } else if (totalPositive > 0 || totalNegative > 0) {
      sentimentScore = 50 + (totalPositive - totalNegative) * 10;
    }

    extraction.sentiment = sentiment;
    extraction.sentimentScore = sentimentScore;

    // Extract keywords (amounts, dates, important terms)
    const keywords: string[] = [];
    if (amounts) keywords.push(...amounts);
    
    extraction.keywords = keywords;

    // Extract key quotes (meaningful sentences)
    if (text.length > 30 && (hasPromise || hasAgreement || hasSignificantContent)) {
      extraction.keyQuotes = [text.slice(0, 150)];
    }

    return { extraction, hasSignificantContent };
  }, []);

  const generateSummary = useCallback((fullTranscript: string, extraction: CallExtraction): string => {
    const parts: string[] = [];

    // Analyze full transcript
    const wordCount = fullTranscript.split(/\s+/).length;
    parts.push(`Transcription contains ${wordCount} words.`);

    if (extraction.promises.length > 0) {
      const totalAmount = extraction.promises.reduce((sum, p) => sum + (p.amount || 0), 0);
      if (totalAmount > 0) {
        parts.push(`Payment commitment of KES ${new Intl.NumberFormat('en-KE').format(totalAmount)} was made.`);
      } else {
        parts.push(`${extraction.promises.length} payment promise(s) were made.`);
      }
    }

    if (extraction.objections.length > 0) {
      const types = [...new Set(extraction.objections.map(o => o.type.replace('_', ' ')))];
      parts.push(`Concerns raised: ${types.join(', ')}.`);
    }

    if (extraction.agreements.length > 0) {
      const types = [...new Set(extraction.agreements.map(a => a.type.replace('_', ' ')))];
      parts.push(`Agreements: ${types.join(', ')}.`);
    }

    const sentimentText = {
      positive: 'Overall sentiment was positive.',
      neutral: 'Overall sentiment was neutral.',
      negative: 'Overall sentiment showed some concerns.',
    };
    parts.push(sentimentText[extraction.sentiment]);

    return parts.join(' ');
  }, []);

  return { analyzeText, generateSummary };
}
