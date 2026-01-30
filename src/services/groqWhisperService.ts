import Groq from 'groq-sdk';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

const groq = new Groq({
  apiKey: GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Allow browser usage
});

export interface TranscriptionResult {
  text: string;
  duration?: number;
  language?: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export interface TranscriptionProgress {
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
}

type ProgressCallback = (progress: TranscriptionProgress) => void;

export async function transcribeAudioFile(
  file: File,
  language: 'en' | 'sw' = 'en',
  onProgress?: ProgressCallback
): Promise<TranscriptionResult> {
  try {
    // Validate file
    const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/m4a', 'audio/ogg', 'audio/flac'];
    
    // Check file extension as fallback
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['mp3', 'wav', 'webm', 'm4a', 'ogg', 'flac', 'mpeg'];
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(extension || '')) {
      throw new Error(`Unsupported audio format: ${file.type || extension}. Supported: MP3, WAV, WebM, M4A, OGG, FLAC`);
    }

    // Check file size (max 25MB for Groq)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: 25MB`);
    }

    onProgress?.({
      status: 'uploading',
      progress: 10,
      message: 'Preparing audio file...'
    });

    onProgress?.({
      status: 'processing',
      progress: 30,
      message: 'Sending to Whisper AI...'
    });

    // Use Groq's Whisper model
    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: 'whisper-large-v3',
      language: language,
      response_format: 'verbose_json',
      temperature: 0.0
    }) as any; // Cast to any for verbose_json response

    onProgress?.({
      status: 'processing',
      progress: 80,
      message: 'Processing transcription...'
    });

    onProgress?.({
      status: 'completed',
      progress: 100,
      message: 'Transcription complete!'
    });

    return {
      text: transcription.text,
      duration: transcription.duration || undefined,
      language: transcription.language || undefined,
      segments: transcription.segments?.map((seg: any) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text
      }))
    };
  } catch (error: any) {
    console.error('Groq Whisper error:', error);
    
    onProgress?.({
      status: 'error',
      progress: 0,
      message: error.message || 'Transcription failed'
    });

    throw new Error(error.message || 'Failed to transcribe audio');
  }
}

// Convert blob to file
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}

// Format duration to readable string
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Check if browser supports audio recording
export function canRecordAudio(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Record audio from microphone and return as file
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm'
      });
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
    } catch (error: any) {
      throw new Error(`Microphone access denied: ${error.message}`);
    }
  }

  stop(): Promise<File> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioFile = blobToFile(audioBlob, `recording-${Date.now()}.webm`);
        
        // Clean up
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }
        
        resolve(audioFile);
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}
