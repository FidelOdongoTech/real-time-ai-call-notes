import { useState, useEffect, useCallback, useRef } from 'react';
import type { SpeechRecognition, SpeechRecognitionEvent } from '../types';

export type SupportedLanguage = 'en-KE' | 'sw-KE' | 'en-US';

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  language?: SupportedLanguage;
  continuous?: boolean;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    onResult,
    onError,
    language = 'en-KE',
    continuous = true,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldRestartRef = useRef(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  // Keep refs updated
  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  const isSupported = typeof window !== 'undefined' && 
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);

  const clearRestartTimeout = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }, []);

  const startRecognition = useCallback(() => {
    if (!isSupported) return;

    // Clear any pending restart
    clearRestartTimeout();

    // Clean up existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore errors when aborting
      }
      recognitionRef.current = null;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += text;
        } else {
          interim += text;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
        onResultRef.current?.(finalTranscript, true);
      }

      setInterimTranscript(interim);
      if (interim) {
        onResultRef.current?.(interim, false);
      }
    };

    recognition.onerror = (event: Event) => {
      const errorEvent = event as Event & { error: string };
      
      // Don't treat these as fatal errors - just restart
      if (errorEvent.error === 'no-speech') {
        // No speech detected - this is normal, just restart
        console.log('No speech detected, will restart...');
        return;
      }
      
      if (errorEvent.error === 'aborted') {
        // Aborted - likely intentional, check if we should restart
        console.log('Recognition aborted');
        return;
      }

      let errorMessage = 'Speech recognition error';
      let shouldStop = false;
      
      switch (errorEvent.error) {
        case 'audio-capture':
          errorMessage = 'No microphone found. Please check your microphone settings.';
          shouldStop = true;
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access and try again.';
          shouldStop = true;
          break;
        case 'network':
          errorMessage = 'Network error. Retrying...';
          // Network errors are temporary, will restart
          break;
        default:
          errorMessage = `Error: ${errorEvent.error}`;
      }
      
      if (shouldStop) {
        setError(errorMessage);
        onErrorRef.current?.(errorMessage);
        shouldRestartRef.current = false;
        setIsListening(false);
      } else {
        console.log('Recoverable error:', errorEvent.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      
      // Auto-restart if we should be listening
      if (shouldRestartRef.current) {
        clearRestartTimeout();
        // Small delay before restart to prevent rapid fire
        restartTimeoutRef.current = setTimeout(() => {
          if (shouldRestartRef.current) {
            console.log('Auto-restarting speech recognition...');
            startRecognition();
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      // If already started, ignore
      if (e instanceof Error && e.message.includes('already started')) {
        console.log('Recognition already started');
      } else {
        setError('Failed to start speech recognition. Please try again.');
        console.error('Speech recognition start error:', e);
        shouldRestartRef.current = false;
      }
    }
  }, [isSupported, continuous, language, clearRestartTimeout]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      const msg = 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.';
      setError(msg);
      onErrorRef.current?.(msg);
      return;
    }

    setError(null);
    shouldRestartRef.current = true;
    startRecognition();
  }, [isSupported, startRecognition]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    clearRestartTimeout();
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore errors when stopping
      }
      recognitionRef.current = null;
    }
    
    setIsListening(false);
    setInterimTranscript('');
  }, [clearRestartTimeout]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Update language while listening
  useEffect(() => {
    if (shouldRestartRef.current && recognitionRef.current) {
      // Restart with new language
      stopListening();
      setTimeout(() => {
        startListening();
      }, 100);
    }
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      clearRestartTimeout();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, [clearRestartTimeout]);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
  };
}
