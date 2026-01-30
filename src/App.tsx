import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Mic, 
  MicOff,
  Moon, 
  Sun, 
  LayoutDashboard,
  History,
  Upload,
  Phone,
  PhoneOff,
  Clock,
  AlertCircle,
  X,
  BarChart3,
  Languages,
  Globe
} from 'lucide-react';
import { useCallStore } from './store/callStore';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTextAnalysis } from './hooks/useTextAnalysis';
import { CustomerInfo } from './components/CustomerInfo';
import { TranscriptPanel } from './components/TranscriptPanel';
import { ExtractionPanel } from './components/ExtractionPanel';
import { CallSummary } from './components/CallSummary';
import { CallHistory } from './components/CallHistory';
import { NewCallForm } from './components/NewCallForm';
import { AgentCoaching } from './components/AgentCoaching';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AudioUpload } from './components/AudioUpload';
import type { Customer, Call, CallHistoryItem } from './types';
import { cn } from './utils/cn';

type View = 'dashboard' | 'history' | 'analytics';
type InputMode = 'microphone' | 'text' | 'upload';
type AppLanguage = 'en-KE' | 'sw-KE';

export function App() {
  const [view, setView] = useState<View>('dashboard');
  const [showNewCallForm, setShowNewCallForm] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('microphone');
  const [textInput, setTextInput] = useState('');
  const [interimText, setInterimText] = useState('');
  const [language, setLanguage] = useState<AppLanguage>('en-KE');
  
  const {
    currentCall,
    callHistory,
    theme,
    startCall,
    endCallWithAI,
    cancelCall,
    addTranscriptEntry,
    updateExtraction,
    updateCallDuration,
    toggleTheme,
  } = useCallStore();

  const { analyzeText } = useTextAnalysis();

  const timerRef = useRef<number | null>(null);

  // Speech recognition hook
  const handleSpeechResult = useCallback((transcript: string, isFinal: boolean) => {
    if (!currentCall || currentCall.status !== 'active') return;

    if (isFinal) {
      addTranscriptEntry({
        speaker: 'user',
        text: transcript,
        timestamp: Date.now(),
        isFinal: true,
      });
      setInterimText('');

      // Analyze the text for extraction
      const fullTranscript = currentCall.transcript.map(t => t.text).join(' ') + ' ' + transcript;
      const { extraction, hasSignificantContent } = analyzeText(transcript, fullTranscript);
      
      if (hasSignificantContent || extraction.sentiment) {
        updateExtraction(extraction);
      }
    } else {
      setInterimText(transcript);
    }
  }, [currentCall, addTranscriptEntry, updateExtraction, analyzeText]);

  const handleSpeechError = useCallback((error: string) => {
    console.error('Speech recognition error:', error);
  }, []);

  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError,
  } = useSpeechRecognition({
    onResult: handleSpeechResult,
    onError: handleSpeechError,
    continuous: true,
    language: language,
  });

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Timer for call duration
  useEffect(() => {
    if (currentCall?.status === 'active') {
      timerRef.current = window.setInterval(() => {
        updateCallDuration(currentCall.duration + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentCall?.status, currentCall?.duration, updateCallDuration]);

  const handleStartCall = (customer: Customer) => {
    resetTranscript();
    startCall(customer);
    setShowNewCallForm(false);
    setView('dashboard');
    setInterimText('');
  };

  const handleStartRecording = () => {
    if (inputMode === 'microphone') {
      startListening();
    }
  };

  const handleStopRecording = () => {
    stopListening();
    setInterimText('');
  };

  const handleEndCall = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    handleStopRecording();
    
    // Use AI to generate summary and next actions
    await endCallWithAI();
  };

  const handleCancelCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    handleStopRecording();
    resetTranscript();
    cancelCall();
  };

  const handleTextSubmit = () => {
    if (!textInput.trim() || !currentCall) return;

    addTranscriptEntry({
      speaker: 'user',
      text: textInput.trim(),
      timestamp: Date.now(),
      isFinal: true,
    });

    const fullTranscript = currentCall.transcript.map(t => t.text).join(' ') + ' ' + textInput;
    const { extraction } = analyzeText(textInput, fullTranscript);
    updateExtraction(extraction);

    setTextInput('');
  };

  // Handle audio transcription from Whisper
  const handleAudioTranscription = useCallback((text: string, _duration?: number) => {
    if (!currentCall) return;
    
    const lines = text.split(/[.!?]/).filter(line => line.trim());
    lines.forEach((line, index) => {
      setTimeout(() => {
        addTranscriptEntry({
          speaker: 'user',
          text: line.trim(),
          timestamp: Date.now(),
          isFinal: true,
        });

        const { extraction } = analyzeText(line, text);
        updateExtraction(extraction);
      }, index * 300);
    });
  }, [currentCall, addTranscriptEntry, analyzeText, updateExtraction]);

  const handleLanguageChange = () => {
    const languages: AppLanguage[] = ['en-KE', 'sw-KE'];
    const currentIndex = languages.indexOf(language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex]);
    
    if (isListening) {
      stopListening();
      setTimeout(() => startListening(), 100);
    }
  };

  const getLanguageLabel = (lang: AppLanguage) => {
    switch (lang) {
      case 'en-KE': return 'English';
      case 'sw-KE': return 'Kiswahili';
      default: return 'English';
    }
  };

  return (
    <div className={cn(
      'min-h-screen transition-colors duration-200',
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    )}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">CallNotes AI</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Real-Time Transcription 🇰🇪</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              <button
                onClick={() => setView('dashboard')}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  view === 'dashboard'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => setView('analytics')}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  view === 'analytics'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </button>
              <button
                onClick={() => setView('history')}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  view === 'history'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
                {callHistory.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                    {callHistory.length}
                  </span>
                )}
              </button>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLanguageChange}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                title="Switch Language"
              >
                <Languages className="w-4 h-4" />
                <span className="hidden sm:inline">{getLanguageLabel(language)}</span>
              </button>
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowNewCallForm(true)}
                disabled={currentCall?.status === 'active'}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">New Session</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {view === 'dashboard' ? (
          <DashboardView
            currentCall={currentCall}
            isListening={isListening}
            isSupported={isSupported}
            speechError={speechError}
            interimText={interimText}
            inputMode={inputMode}
            textInput={textInput}
            language={language}
            onInputModeChange={setInputMode}
            onTextInputChange={setTextInput}
            onTextSubmit={handleTextSubmit}
            onAudioTranscription={handleAudioTranscription}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onEndCall={handleEndCall}
            onCancelCall={handleCancelCall}
            onNewCall={() => setShowNewCallForm(true)}
            onLanguageChange={handleLanguageChange}
          />
        ) : view === 'analytics' ? (
          <AnalyticsDashboard history={callHistory} />
        ) : (
          <HistoryView history={callHistory} />
        )}
      </main>

      {/* New Call Modal */}
      {showNewCallForm && (
        <NewCallForm
          onStart={handleStartCall}
          onCancel={() => setShowNewCallForm(false)}
        />
      )}
    </div>
  );
}

interface DashboardViewProps {
  currentCall: Call | null;
  isListening: boolean;
  isSupported: boolean;
  speechError: string | null;
  interimText: string;
  inputMode: InputMode;
  textInput: string;
  language: AppLanguage;
  onInputModeChange: (mode: InputMode) => void;
  onTextInputChange: (text: string) => void;
  onTextSubmit: () => void;
  onAudioTranscription: (text: string, duration?: number) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onEndCall: () => void;
  onCancelCall: () => void;
  onNewCall: () => void;
  onLanguageChange: () => void;
}

function DashboardView({ 
  currentCall, 
  isListening,
  isSupported,
  speechError,
  interimText,
  inputMode,
  textInput,
  language,
  onInputModeChange,
  onTextInputChange,
  onTextSubmit,
  onAudioTranscription,
  onStartRecording,
  onStopRecording,
  onEndCall,
  onCancelCall,
  onNewCall,
  onLanguageChange,
}: DashboardViewProps) {

  if (!currentCall) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mb-6">
          <Mic className="w-12 h-12 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Active Session</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
          Start a new session to begin real-time transcription with live AI analysis and coaching.
        </p>
        
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Globe className="w-4 h-4" />
          <span>Language: <strong>{language === 'sw-KE' ? 'Kiswahili' : 'English'}</strong></span>
          <button 
            onClick={onLanguageChange}
            className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            Change
          </button>
        </div>
        
        {!isSupported && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3 max-w-md">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Speech Recognition Not Supported
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Please use Chrome, Edge, or Safari for microphone transcription. 
                You can still use text input or upload audio files for Whisper transcription.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onNewCall}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
        >
          <Phone className="w-5 h-5" />
          Start New Session
        </button>
      </div>
    );
  }

  const isActive = currentCall.status === 'active';
  const isCompleted = currentCall.status === 'completed';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Active Call Banner */}
      {isActive && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              {isListening ? (
                <Mic className="w-6 h-6 text-white animate-pulse" />
              ) : (
                <MicOff className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Session Active</h3>
              <p className="text-green-100">with {currentCall.customer.name} • {language === 'sw-KE' ? '🇰🇪 Kiswahili' : '🇬🇧 English'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg text-white">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-lg">{formatTime(currentCall.duration)}</span>
            </div>
            {isListening && (
              <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg text-white">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Recording
              </span>
            )}
            <button
              onClick={onCancelCall}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <CustomerInfo customer={currentCall.customer} />
          
          {/* Recording Controls */}
          {isActive && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Input Mode</h3>
              
              {/* Mode Tabs */}
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
                <button
                  onClick={() => onInputModeChange('microphone')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-md text-xs font-medium transition-colors',
                    inputMode === 'microphone'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  <Mic className="w-3 h-3" />
                  Mic
                </button>
                <button
                  onClick={() => onInputModeChange('text')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-md text-xs font-medium transition-colors',
                    inputMode === 'text'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  Text
                </button>
                <button
                  onClick={() => onInputModeChange('upload')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-md text-xs font-medium transition-colors',
                    inputMode === 'upload'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  <Upload className="w-3 h-3" />
                  Audio
                </button>
              </div>

              {/* Microphone Mode */}
              {inputMode === 'microphone' && (
                <div className="space-y-3">
                  {!isSupported ? (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-xs text-yellow-700 dark:text-yellow-300">
                      Speech recognition not supported. Use Chrome, Edge, or Safari.
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={isListening ? onStopRecording : onStartRecording}
                        className={cn(
                          'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors',
                          isListening
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        )}
                      >
                        {isListening ? (
                          <>
                            <MicOff className="w-5 h-5" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="w-5 h-5" />
                            Start Recording
                          </>
                        )}
                      </button>
                      
                      {isListening && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex gap-0.5">
                              <div className="w-1 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                              <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                              <div className="w-1 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                              <div className="w-1 h-5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
                              <div className="w-1 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '600ms' }} />
                            </div>
                            <span className="text-sm font-medium text-green-700 dark:text-green-300">
                              {language === 'sw-KE' ? 'Inasikiliza...' : 'Listening...'}
                            </span>
                          </div>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            {language === 'sw-KE' 
                              ? 'Ongea wazi kwa sauti ya kawaida' 
                              : 'Speak clearly at a normal volume'}
                          </p>
                        </div>
                      )}
                      
                      {speechError && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-red-600 dark:text-red-400">{speechError}</p>
                              <button
                                onClick={onStartRecording}
                                className="text-xs text-red-700 dark:text-red-300 underline mt-1 hover:no-underline"
                              >
                                {language === 'sw-KE' ? 'Jaribu tena' : 'Try again'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!isListening && !speechError && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          <p className="font-medium">{language === 'sw-KE' ? 'Vidokezo:' : 'Tips:'}</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            <li>{language === 'sw-KE' ? 'Tumia Chrome kwa matokeo bora' : 'Use Chrome for best results'}</li>
                            <li>{language === 'sw-KE' ? 'Ruhusu ufikiaji wa maikrofoni' : 'Allow microphone access'}</li>
                            <li>{language === 'sw-KE' ? 'Ongea wazi na polepole' : 'Speak clearly and steadily'}</li>
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Text Mode */}
              {inputMode === 'text' && (
                <div className="space-y-3">
                  <textarea
                    value={textInput}
                    onChange={(e) => onTextInputChange(e.target.value)}
                    placeholder={language === 'sw-KE' ? 'Andika au bandika maandishi hapa...' : 'Type or paste text here...'}
                    className="w-full h-24 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={onTextSubmit}
                    disabled={!textInput.trim()}
                    className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    {language === 'sw-KE' ? 'Ongeza kwa Transcript' : 'Add to Transcript'}
                  </button>
                </div>
              )}

              {/* Upload Mode - Whisper Transcription */}
              {inputMode === 'upload' && (
                <AudioUpload
                  onTranscriptionComplete={onAudioTranscription}
                  language={language}
                  disabled={false}
                />
              )}

              {/* End Session Button */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={onEndCall}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                  <PhoneOff className="w-5 h-5" />
                  {language === 'sw-KE' ? 'Maliza Kikao' : 'End Session'}
                </button>
              </div>
            </div>
          )}

          {/* Agent Coaching - Only show during active session */}
          {isActive && (
            <AgentCoaching
              isActive={isActive}
              transcript={currentCall.transcript.map(t => t.text).join(' ')}
              sentiment={currentCall.extraction.sentimentScore}
              customerName={currentCall.customer.name}
              debtAmount={currentCall.customer.debtAmount}
              language={language}
            />
          )}
        </div>

        {/* Center - Transcription */}
        <div className="lg:col-span-5">
          <TranscriptPanel
            transcript={currentCall.transcript}
            isActive={isActive && isListening}
            interimText={interimText}
            error={speechError}
          />
        </div>

        {/* Right Sidebar - Extraction */}
        <div className="lg:col-span-4">
          <ExtractionPanel
            extraction={currentCall.extraction}
            isActive={isActive}
          />
        </div>
      </div>

      {/* Call Summary */}
      {isCompleted && currentCall.summary && (
        <div className="mt-8">
          <CallSummary call={currentCall} />
        </div>
      )}
    </div>
  );
}

interface HistoryViewProps {
  history: CallHistoryItem[];
}

function HistoryView({ history }: HistoryViewProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <CallHistory history={history} />
    </div>
  );
}
