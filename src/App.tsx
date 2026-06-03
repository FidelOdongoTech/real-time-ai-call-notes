import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  Globe,
  Sparkles,
  Activity,
  Plus
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
import { demoTemplates, type DemoTemplate } from './data/demoData';

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
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  
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

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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

  const startDemoSession = useCallback(async (template: DemoTemplate = 'cooperative') => {
    setIsDemoRunning(true);
    const demo = demoTemplates[template];
    handleStartCall(demo.customer);

    // Wait for call to be created
    await new Promise(resolve => setTimeout(resolve, 500));

    // Stream transcript entries with delays
    for (const entry of demo.script) {
      await new Promise(resolve => setTimeout(resolve, entry.delay));
      addTranscriptEntry({
        speaker: entry.speaker,
        text: entry.text,
        timestamp: Date.now(),
        isFinal: true,
      });

      // Run extraction on each new entry
      const state = useCallStore.getState();
      const fullTranscript = state.currentCall?.transcript.map(t => t.text).join(' ') || '';
      const { extraction } = analyzeText(entry.text, fullTranscript);
      updateExtraction(extraction);
    }

    // Auto-end the call after all entries
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsDemoRunning(false);
    handleEndCall();
  }, [handleStartCall, addTranscriptEntry, handleEndCall, analyzeText, updateExtraction]);

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

  const navItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics' as View, label: 'Analytics', icon: BarChart3 },
    { id: 'history' as View, label: 'History', icon: History, count: callHistory.length },
  ];

  return (
    <div className={cn(
      'h-screen flex flex-col transition-colors duration-300',
      theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
    )}>
      {/* Header */}
      <header className={cn(
        'sticky top-0 z-40 border-b transition-colors duration-300',
        theme === 'dark' ? 'bg-slate-950 border-slate-700/50' : 'bg-white border-slate-200/60'
      )}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-8">
              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div className="leading-none">
                  <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">CallNotes</h1>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">AI Platform</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="hidden sm:flex items-center gap-0.5">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={cn(
                      'relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                      view === item.id
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {item.count !== undefined && item.count > 0 && (
                      <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-semibold rounded-full">
                        {item.count}
                      </span>
                    )}
                    {view === item.id && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-md bg-slate-100 dark:bg-slate-800 -z-10"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
                      />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLanguageChange}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
                  theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                )}
                title="Switch Language"
              >
                <Languages className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{getLanguageLabel(language)}</span>
              </button>
              <button
                onClick={toggleTheme}
                className={cn(
                  'w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200',
                  theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                )}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
              <button
                onClick={() => setShowNewCallForm(true)}
                disabled={currentCall?.status === 'active'}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md transition-all duration-200 active:scale-[0.97] shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Session</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <div className={cn(
        'sm:hidden flex border-b transition-colors duration-300',
        theme === 'dark' ? 'bg-slate-950 border-slate-700/50' : 'bg-white border-slate-200/60'
      )}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
              view === item.id
                ? 'text-indigo-500 border-b-2 border-indigo-500'
                : 'text-slate-500 dark:text-slate-400'
            )}
          >
            <item.icon className="w-3.5 h-3.5" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
          <AnimatePresence mode="wait">
            {view === 'dashboard' ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
              <DashboardView
                currentCall={currentCall}
                theme={theme}
                isListening={isListening}
                isSupported={isSupported}
                speechError={speechError}
                interimText={interimText}
                inputMode={inputMode}
                textInput={textInput}
                language={language}
                isDemoRunning={isDemoRunning}
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
                onStartDemo={startDemoSession}
              />
              </motion.div>
            ) : view === 'analytics' ? (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto"
              >
                <AnalyticsDashboard history={callHistory} />
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto"
              >
                <CallHistory history={callHistory} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

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
  theme: 'light' | 'dark';
  isListening: boolean;
  isSupported: boolean;
  speechError: string | null;
  interimText: string;
  inputMode: InputMode;
  textInput: string;
  language: AppLanguage;
  isDemoRunning: boolean;
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
  onStartDemo: (template: DemoTemplate) => void;
}

function DashboardView({ 
  currentCall, 
  theme,
  isListening,
  isSupported,
  speechError,
  interimText,
  inputMode,
  textInput,
  language,
  isDemoRunning,
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
  onStartDemo,
}: DashboardViewProps) {

  if (!currentCall) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center h-full px-4"
      >
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Mic className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No active session</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center max-w-sm leading-relaxed">
          Start a new session to begin real-time transcription with AI analysis and coaching.
        </p>
        
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-200/60 dark:border-slate-700/50">
          <Globe className="w-3.5 h-3.5" />
          <span>Language: <span className="font-medium">{language === 'sw-KE' ? 'Kiswahili' : 'English'}</span></span>
          <button 
            onClick={onLanguageChange}
            className="ml-1 text-indigo-500 hover:text-indigo-600 font-medium"
          >
            Change
          </button>
        </div>

        {!isSupported && (
          <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/50 rounded-lg flex items-start gap-2.5 max-w-sm">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Speech Recognition Not Supported</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
                Use Chrome, Edge, or Safari. You can still use text or audio upload.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={onNewCall}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-all duration-200 active:scale-[0.97] shadow-sm"
          >
            <Phone className="w-4 h-4" />
            Start New Session
          </button>
          <button
            onClick={() => onStartDemo('cooperative')}
            disabled={isDemoRunning}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg transition-all duration-200 active:scale-[0.97]"
          >
            <Sparkles className="w-4 h-4" />
            {isDemoRunning ? 'Running...' : 'Demo: Cooperative'}
          </button>
          <button
            onClick={() => onStartDemo('hostile')}
            disabled={isDemoRunning}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-red-200/60 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-900/10 disabled:opacity-50 disabled:cursor-not-allowed text-red-600 dark:text-red-400 text-sm font-semibold rounded-lg transition-all duration-200 active:scale-[0.97]"
          >
            <AlertCircle className="w-4 h-4" />
            {isDemoRunning ? 'Running...' : 'Demo: Hostile'}
          </button>
        </div>
      </motion.div>
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
    <div className="h-full flex flex-col">
      {/* Active Call Bar (stays at top) */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex-shrink-0 flex items-center justify-between bg-slate-900 dark:bg-slate-800 rounded-lg px-4 py-3 mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center">
              {isListening ? (
                <Mic className="w-4 h-4 text-emerald-400" />
              ) : (
                <MicOff className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">Active session</span>
                <span className="text-[10px] text-slate-400 bg-white/10 px-1.5 py-0.5 rounded">{language === 'sw-KE' ? '🇰🇪 Kiswahili' : '🇬🇧 English'}</span>
              </div>
              <p className="text-xs text-slate-400">with {currentCall.customer.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-md">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm font-mono font-semibold text-white tabular-nums">{formatTime(currentCall.duration)}</span>
            </div>
            {isListening && (
              <span className="flex items-center gap-1.5 bg-emerald-500/20 px-2.5 py-1.5 rounded-md">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-emerald-400">Recording</span>
              </span>
            )}
            <button
              onClick={onCancelCall}
              className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Grid — fills remaining height, columns scroll independently on desktop */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Sidebar */}
        <div className="lg:col-span-3 space-y-4 overflow-y-auto min-h-0">
          <CustomerInfo customer={currentCall.customer} />
          
          {isActive && (
            <CallControlsSection
              inputMode={inputMode}
              isListening={isListening}
              isSupported={isSupported}
              speechError={speechError}
              textInput={textInput}
              language={language}
              onInputModeChange={onInputModeChange}
              onTextInputChange={onTextInputChange}
              onTextSubmit={onTextSubmit}
              onAudioTranscription={onAudioTranscription}
              onStartRecording={onStartRecording}
              onStopRecording={onStopRecording}
              onEndCall={onEndCall}
            />
          )}

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

        {/* Center - Transcript (scrolls internally) */}
        <div className="lg:col-span-6 min-h-0">
          <TranscriptPanel
            transcript={currentCall.transcript}
            isActive={isActive && isListening}
            interimText={interimText}
            error={speechError}
          />
        </div>

        {/* Right Sidebar - AI Insights (scrolls internally) */}
        <div className="lg:col-span-3 min-h-0">
          <ExtractionPanel
            extraction={currentCall.extraction}
            isActive={isActive}
          />
        </div>
      </div>

      {/* Call Summary (at bottom when completed) */}
      {isCompleted && currentCall.summary && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0 mt-4"
        >
          <CallSummary call={currentCall} />
        </motion.div>
      )}
    </div>
  );
}

interface CallControlsSectionProps {
  inputMode: InputMode;
  isListening: boolean;
  isSupported: boolean;
  speechError: string | null;
  textInput: string;
  language: AppLanguage;
  onInputModeChange: (mode: InputMode) => void;
  onTextInputChange: (text: string) => void;
  onTextSubmit: () => void;
  onAudioTranscription: (text: string, duration?: number) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onEndCall: () => void;
}

function CallControlsSection({
  inputMode,
  isListening,
  isSupported,
  speechError,
  textInput,
  language,
  onInputModeChange,
  onTextInputChange,
  onTextSubmit,
  onAudioTranscription,
  onStartRecording,
  onStopRecording,
  onEndCall,
}: CallControlsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-lg p-4"
    >
      <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Input Mode</h3>
      
      {/* Mode Tabs */}
      <div className="flex gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-700 rounded-md mb-3">
        {([
          { value: 'microphone' as InputMode, icon: Mic, label: 'Mic' },
          { value: 'text' as InputMode, icon: null, label: 'Text' },
          { value: 'upload' as InputMode, icon: Upload, label: 'Audio' },
        ]).map((mode) => (
          <button
            key={mode.value}
            onClick={() => onInputModeChange(mode.value)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-[4px] text-xs font-medium transition-all duration-200',
              inputMode === mode.value
                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            {mode.icon && <mode.icon className="w-3 h-3" />}
            {mode.label}
          </button>
        ))}
      </div>

      {/* Microphone Mode */}
      {inputMode === 'microphone' && (
        <div className="space-y-2.5">
          {!isSupported ? (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/50 rounded-md text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
              Speech recognition not supported. Use Chrome, Edge, or Safari.
            </div>
          ) : (
            <>
              <button
                onClick={isListening ? onStopRecording : onStartRecording}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-all duration-200 active:scale-[0.98]',
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                )}
              >
                {isListening ? (
                  <><MicOff className="w-3.5 h-3.5" /> Stop Recording</>
                ) : (
                  <><Mic className="w-3.5 h-3.5" /> Start Recording</>
                )}
              </button>
              
              {isListening && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/50 rounded-md p-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-0.5">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="w-0.5 bg-emerald-500 rounded-full animate-pulse"
                          style={{ height: `${[6, 8, 4, 10, 6][i]}px`, animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      {language === 'sw-KE' ? 'Inasikiliza...' : 'Listening...'}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    {language === 'sw-KE' ? 'Ongea wazi kwa sauti ya kawaida' : 'Speak clearly at a normal volume'}
                  </p>
                </div>
              )}
              
              {speechError && (
                <div className="flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/50 rounded-md">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[11px] text-red-600 dark:text-red-400">{speechError}</p>
                    <button onClick={onStartRecording} className="text-[11px] text-red-700 dark:text-red-300 underline mt-0.5">
                      {language === 'sw-KE' ? 'Jaribu tena' : 'Try again'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Text Mode */}
      {inputMode === 'text' && (
        <div className="space-y-2.5">
          <textarea
            value={textInput}
            onChange={(e) => onTextInputChange(e.target.value)}
            placeholder={language === 'sw-KE' ? 'Andika au bandika maandishi hapa...' : 'Type or paste text here...'}
            className="w-full h-20 p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200/60 dark:border-slate-600/60 rounded-md text-xs text-slate-900 dark:text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
          />
          <button
            onClick={onTextSubmit}
            disabled={!textInput.trim()}
            className="w-full py-2 px-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md transition-all duration-200 active:scale-[0.98]"
          >
            {language === 'sw-KE' ? 'Ongeza kwa Transcript' : 'Add to Transcript'}
          </button>
        </div>
      )}

      {/* Upload Mode */}
      {inputMode === 'upload' && (
        <AudioUpload
          onTranscriptionComplete={onAudioTranscription}
          language={language}
          disabled={false}
        />
      )}

      {/* End Session */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
        <button
          onClick={onEndCall}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-md transition-all duration-200 active:scale-[0.98]"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          {language === 'sw-KE' ? 'Maliza Kikao' : 'End Session'}
        </button>
      </div>
    </motion.div>
  );
}
