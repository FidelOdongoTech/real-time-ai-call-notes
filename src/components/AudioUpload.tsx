import React, { useState, useRef } from 'react';
import { Upload, FileAudio, Loader2, CheckCircle, XCircle, Mic, Square } from 'lucide-react';
import { cn } from '../utils/cn';
import { transcribeAudioFile, TranscriptionProgress, AudioRecorder } from '../services/groqWhisperService';

interface AudioUploadProps {
  onTranscriptionComplete: (text: string, duration?: number) => void;
  language: 'en-KE' | 'sw-KE';
  disabled?: boolean;
}

export const AudioUpload: React.FC<AudioUploadProps> = ({
  onTranscriptionComplete,
  language,
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<TranscriptionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setProgress({ status: 'uploading', progress: 0, message: 'Starting...' });

    try {
      const result = await transcribeAudioFile(
        selectedFile,
        language === 'sw-KE' ? 'sw' : 'en',
        setProgress
      );
      onTranscriptionComplete(result.text, result.duration);
    } catch (err: any) {
      setError(err.message);
      setProgress(null);
    }
  };

  const startRecording = async () => {
    try {
      recorderRef.current = new AudioRecorder();
      await recorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setError(null);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      const audioFile = await recorderRef.current.stop();
      setIsRecording(false);
      setFile(audioFile);
      setProgress({ status: 'uploading', progress: 0, message: 'Processing recording...' });
      const result = await transcribeAudioFile(
        audioFile,
        language === 'sw-KE' ? 'sw' : 'en',
        setProgress
      );
      onTranscriptionComplete(result.text, result.duration);
    } catch (err: any) {
      setError(err.message);
      setProgress(null);
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetUpload = () => {
    setFile(null);
    setProgress(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-3">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={disabled || progress?.status === 'processing'}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-slate-400 text-white text-xs font-semibold rounded-md transition-all active:scale-[0.98]"
          >
            <Mic className="w-3.5 h-3.5" />
            Record
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-md transition-all"
          >
            <Square className="w-3.5 h-3.5" />
            Stop ({formatTime(recordingTime)})
          </button>
        )}
        <span className="text-xs text-slate-500 dark:text-slate-400">or</span>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          'relative border border-dashed rounded-md p-6 text-center cursor-pointer transition-all duration-200',
          isDragging 
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
            : 'border-slate-300/60 dark:border-slate-600/60 hover:border-indigo-400 dark:hover:border-indigo-500',
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.webm,.m4a,.ogg,.flac"
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />

        {progress ? (
          <div className="space-y-2">
            {progress.status === 'completed' ? (
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
            ) : progress.status === 'error' ? (
              <XCircle className="w-8 h-8 text-red-500 mx-auto" />
            ) : (
              <Loader2 className="w-8 h-8 text-indigo-500 mx-auto animate-spin" />
            )}
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{progress.message}</p>
            {progress.status !== 'error' && progress.status !== 'completed' && (
              <div className="w-full bg-slate-200/60 dark:bg-slate-700 rounded-full h-1.5">
                <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress.progress}%` }} />
              </div>
            )}
            {progress.status === 'completed' && (
              <button onClick={(e) => { e.stopPropagation(); resetUpload(); }} className="text-[11px] text-indigo-500 hover:underline">
                Upload another file
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-2">
              {file ? (
                <FileAudio className="w-8 h-8 text-indigo-500" />
              ) : (
                <Upload className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              {file ? file.name : 'Drop audio file here or click to upload'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Supports: MP3, WAV, WebM, M4A, OGG, FLAC (max 25MB)
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/50 rounded-md">
          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          <button onClick={resetUpload} className="ml-auto text-xs text-red-700 dark:text-red-300 underline">
            Try again
          </button>
        </div>
      )}

      <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
        Audio transcribed using Whisper AI via Groq
      </p>
    </div>
  );
};
