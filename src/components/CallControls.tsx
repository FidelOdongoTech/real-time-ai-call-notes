import { Phone, PhoneOff, Mic, MicOff, Clock } from 'lucide-react';
import { cn } from '../utils/cn';

interface CallControlsProps {
  isActive: boolean;
  isMuted: boolean;
  duration: number;
  onStart: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
}

export function CallControls({
  isActive,
  isMuted,
  duration,
  onStart,
  onEnd,
  onToggleMute,
}: CallControlsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Call Controls</h3>
      
      {isActive && (
        <div className="flex items-center justify-center gap-2 mb-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="text-2xl font-mono font-semibold text-gray-900 dark:text-white">
            {formatTime(duration)}
          </span>
          <span className="flex items-center gap-1.5 ml-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-red-500 font-medium">LIVE</span>
          </span>
        </div>
      )}
      
      <div className="flex gap-3">
        {!isActive ? (
          <button
            onClick={onStart}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
          >
            <Phone className="w-5 h-5" />
            Start Call
          </button>
        ) : (
          <>
            <button
              onClick={onToggleMute}
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors",
                isMuted
                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              )}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button
              onClick={onEnd}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              <PhoneOff className="w-5 h-5" />
              End Call
            </button>
          </>
        )}
      </div>
    </div>
  );
}
