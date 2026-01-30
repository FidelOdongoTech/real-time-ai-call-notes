import React, { useState, useRef } from 'react';
import { Upload, FileAudio, Loader2, CheckCircle, XCircle, Mic, Square } from 'lucide-react';
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

      // Start timer
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
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const audioFile = await recorderRef.current.stop();
      setIsRecording(false);
      setFile(audioFile);
      
      // Transcribe the recorded audio
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
    <div className="space-y-4">
      {/* Recording Option */}
      <div className="flex items-center justify-center gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={disabled || progress?.status === 'processing'}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white rounded-lg transition-colors"
          >
            <Mic className="w-5 h-5" />
            Record Audio
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors animate-pulse"
          >
            <Square className="w-5 h-5" />
            Stop Recording ({formatTime(recordingTime)})
          </button>
        )}
        <span className="text-gray-500 dark:text-gray-400">or</span>
      </div>

      {/* File Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
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
          <div className="space-y-3">
            {progress.status === 'completed' ? (
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            ) : progress.status === 'error' ? (
              <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            ) : (
              <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
            )}
            
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {progress.message}
            </p>
            
            {progress.status !== 'error' && progress.status !== 'completed' && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            )}

            {progress.status === 'completed' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetUpload();
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Upload another file
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              {file ? (
                <FileAudio className="w-12 h-12 text-blue-500" />
              ) : (
                <Upload className="w-12 h-12 text-gray-400" />
              )}
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              {file ? file.name : 'Drop audio file here or click to upload'}
            </p>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Supports: MP3, WAV, WebM, M4A, OGG, FLAC (max 25MB)
            </p>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
          <button
            onClick={resetUpload}
            className="ml-auto text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        🎤 Audio is transcribed using Whisper AI via Groq (free & fast!)
      </p>
    </div>
  );
};
