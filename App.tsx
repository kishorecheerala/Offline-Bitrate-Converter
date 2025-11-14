import React, { useState, useEffect, useRef } from 'react';
import type { ConversionPreset } from './types';
import FileUploader from './components/FileUploader';
import ConversionOptions from './components/ConversionOptions';
import ProgressBar from './components/ProgressBar';
import ResultDisplay from './components/ResultDisplay';
import LogViewer from './components/LogViewer';
import { VideoIcon } from './components/icons/VideoIcon';

// Explicitly declare FFmpeg on the window object
declare global {
  interface Window {
    FFmpeg: any;
  }
}

type AppState = 'loading' | 'ready' | 'processing' | 'done' | 'error';

const presets: ConversionPreset[] = [
    { name: 'Netflix HD Lite', bitrate: '3000k', description: 'Good for streaming on limited bandwidth.' },
    { name: 'Standard HD (720p)', bitrate: '5000k', description: 'Good balance of quality and file size.' },
    { name: 'Netflix HD (1080p)', bitrate: '6000k', description: 'Recommended for high-quality streaming.' },
    { name: 'High Quality (1080p)', bitrate: '8000k', description: 'Excellent quality for most displays.' },
    { name: 'Master Quality', bitrate: '20000k', description: 'For very high bitrate source content.' },
];

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('loading');
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [targetBitrate, setTargetBitrate] = useState<string>('6000k');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const ffmpegRef = useRef<any>(null);

  const loadFfmpeg = async () => {
    try {
      // Poll for FFmpeg to be ready on the window object to prevent race conditions
      await new Promise<void>((resolve, reject) => {
        const maxRetries = 50; // 50 * 200ms = 10 seconds timeout
        let retries = 0;
        const interval = setInterval(() => {
          if (window.FFmpeg) {
            clearInterval(interval);
            resolve();
          } else if (retries++ > maxRetries) {
            clearInterval(interval);
            reject(new Error("Timeout: FFmpeg library did not load in time."));
          }
        }, 200);
      });

      const { createFFmpeg } = window.FFmpeg;
      const ffmpeg = createFFmpeg({
        log: false, // We'll handle logs manually
        corePath: 'https://unpkg.com/@ffmpeg/core-st@0.12.6/dist/umd/ffmpeg-core.js',
      });
      
      ffmpeg.setLogger(({ type, message }: { type: string; message: string }) => {
        setLogs(prev => [...prev, `[${type}] ${message}`]);
      });

      ffmpeg.setProgress(({ ratio }: { ratio: number }) => {
        setProgress(Math.max(0, Math.min(1, ratio)));
      });

      await ffmpeg.load();
      ffmpegRef.current = ffmpeg;
      setAppState('ready');
    } catch (error) {
      console.error("Failed to load FFmpeg:", error);
      setLoadingError("Failed to initialize the converter engine. Please try refreshing the page. The required libraries might be blocked or failed to load.");
      setAppState('error');
    }
  };

  useEffect(() => {
    loadFfmpeg();
  }, []);

  const handleFileSelect = (file: File) => {
    setVideoFile(file);
    setConversionError(null);
  };
  
  const handleClearFile = () => {
    setVideoFile(null);
    setConversionError(null);
  }

  const getOutputFilename = (inputFilename: string): string => {
      const parts = inputFilename.split('.');
      const extension = parts.pop() || 'mp4';
      const name = parts.join('.');
      return `${name}-converted.${extension}`;
  }

  const handleConvert = async () => {
    if (!videoFile || !ffmpegRef.current || !targetBitrate) return;

    setAppState('processing');
    setProgress(0);
    setLogs([]);
    setConversionError(null);

    const ffmpeg = ffmpegRef.current;
    const { fetchFile } = window.FFmpeg;
    const inputFilename = videoFile.name;
    const outputFilename = getOutputFilename(inputFilename);

    try {
      ffmpeg.FS('writeFile', inputFilename, await fetchFile(videoFile));

      await ffmpeg.run(
        '-i', inputFilename,
        '-b:v', targetBitrate,
        '-c:a', 'aac', // Re-encode audio to aac for max compatibility
        '-movflags', '+faststart', // Optimize for web streaming
        outputFilename
      );

      const data = ffmpeg.FS('readFile', outputFilename);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
      setOutputUrl(url);
      setAppState('done');

    } catch (error) {
        console.error("Conversion failed:", error);
        setConversionError("The video conversion failed. This can happen with unsupported video codecs or formats. Please check the logs for details and try a different file.");
        setAppState('error');
    } finally {
        // Cleanup filesystem
        try {
            ffmpeg.FS('unlink', inputFilename);
            ffmpeg.FS('unlink', outputFilename);
        } catch (e) {
            console.warn("Could not clean up files:", e);
        }
    }
  };

  const handleReset = () => {
    setOutputUrl(null);
    setVideoFile(null);
    setProgress(0);
    setLogs([]);
    setConversionError(null);
    setAppState('ready');
  };

  const renderContent = () => {
    switch (appState) {
      case 'loading':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Initializing Converter Engine...</h2>
            <p className="text-gray-400">This may take a moment. Please wait.</p>
          </div>
        );
      case 'error':
        return (
             <div className="text-center bg-red-900/50 border border-red-500 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 text-red-300">An Error Occurred</h2>
                <p className="text-red-200 mb-6">{loadingError || conversionError}</p>
                <button
                    onClick={handleReset}
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors"
                >
                    Try Again
                </button>
            </div>
        )
      case 'processing':
        return (
          <div className="space-y-6">
            <ProgressBar progress={progress} />
            <LogViewer logs={logs} />
          </div>
        );
      case 'done':
        return <ResultDisplay url={outputUrl!} originalFileName={videoFile!.name} onReset={handleReset} />;
      case 'ready':
      default:
        return (
          <div className="space-y-8">
            {videoFile ? (
                <div className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4 overflow-hidden">
                        <VideoIcon className="h-10 w-10 text-blue-400 flex-shrink-0"/>
                        <div className="overflow-hidden">
                            <p className="font-semibold text-white truncate">{videoFile.name}</p>
                            <p className="text-sm text-gray-400">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                    </div>
                    <button onClick={handleClearFile} className="text-gray-400 hover:text-white transition-colors text-sm font-semibold">Clear</button>
                </div>
            ) : (
                <FileUploader onFileSelect={handleFileSelect} disabled={false} />
            )}

            {videoFile && (
                <>
                    <ConversionOptions
                        presets={presets}
                        onBitrateChange={setTargetBitrate}
                        currentBitrate={targetBitrate}
                    />
                    <button
                        onClick={handleConvert}
                        disabled={!videoFile || !targetBitrate}
                        className="w-full py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Convert Video
                    </button>
                </>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
      <main className="w-full max-w-2xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Offline Bitrate Converter
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Process videos directly in your browser. Fast, private, and secure.
          </p>
        </header>
        <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;