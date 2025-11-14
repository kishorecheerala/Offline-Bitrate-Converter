import React, { useState, useEffect, useRef } from 'react';
import type { ConversionPreset } from './types';
import FileUploader from './components/FileUploader';
import ConversionOptions from './components/ConversionOptions';
import ProgressBar from './components/ProgressBar';
import ResultDisplay from './components/ResultDisplay';
import LogViewer from './components/LogViewer';

// Explicitly declare FFmpeg on the window object
declare global {
  interface Window {
    FFmpeg: any;
  }
}

const timeToSeconds = (timeStr: string): number => {
  const [hours, minutes, seconds] = timeStr.split(':').map(parseFloat);
  return hours * 3600 + minutes * 60 + seconds;
};

const App: React.FC = () => {
  const [ffmpegReady, setFfmpegReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [targetBitrate, setTargetBitrate] = useState<string>('6000k');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversionStats, setConversionStats] = useState({ fps: 0, speed: '0x' });
  const ffmpegRef = useRef<any>(null);
  const videoDurationRef = useRef(0);

  const loadFfmpeg = async () => {
    try {
      const { createFFmpeg, fetchFile } = window.FFmpeg;
      const ffmpeg = createFFmpeg({
        log: false, // We'll handle logs manually
        corePath: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/ffmpeg-core.js',
        progress: ({ ratio }) => {
          setLoadingProgress(Math.max(0, Math.min(1, ratio)));
        },
      });

      ffmpeg.setLogger(({ type, message }: { type: string; message: string }) => {
        setLogs(prev => [...prev, message]);

        // Parse duration from logs
        const durationMatch = message.match(/Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/);
        if (durationMatch?.[1]) {
          const durationInSeconds = timeToSeconds(durationMatch[1]);
          videoDurationRef.current = durationInSeconds;
          return;
        }

        // Parse progress from logs if duration is known
        if (videoDurationRef.current > 0) {
          const timeMatch = message.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
          if (timeMatch?.[1]) {
            const currentTimeInSeconds = timeToSeconds(timeMatch[1]);
            const calculatedProgress = currentTimeInSeconds / videoDurationRef.current;
            setProgress(Math.min(1, calculatedProgress));
          }
        }
        
        // Parse stats from logs
        const fpsMatch = message.match(/fps=\s*(\d+(\.\d+)?)/);
        const speedMatch = message.match(/speed=\s*(\d+\.?\d*x)/);

        if (fpsMatch || speedMatch) {
          setConversionStats(prev => ({
            fps: fpsMatch ? Math.round(parseFloat(fpsMatch[1])) : prev.fps,
            speed: speedMatch ? speedMatch[1] : prev.speed,
          }));
        }
      });

      await ffmpeg.load();
      ffmpegRef.current = { ffmpeg, fetchFile };
      setFfmpegReady(true);
    } catch (error) {
      console.error("Failed to load FFmpeg:", error);
      const errorMessage = `Failed to load FFmpeg. This can happen if your browser doesn't support the required features (like SharedArrayBuffer) or if there's a network issue. Please try reloading or using a modern browser like Chrome or Firefox.\n\nError: ${error}`;
      setLogs(prev => [...prev, `Error: ${errorMessage}`]);
      setLoadingError(errorMessage);
    }
  };

  useEffect(() => {
    const checkForFFmpeg = () => {
      if (window.FFmpeg) {
        loadFfmpeg();
      } else {
        setTimeout(checkForFFmpeg, 100); // Check again in 100ms
      }
    };
    checkForFFmpeg();
  }, []);

  const handleConvert = async () => {
    if (!videoFile || !targetBitrate || !ffmpegRef.current) return;

    setIsProcessing(true);
    setProgress(0);
    setLogs([]);
    setOutputUrl(null);
    videoDurationRef.current = 0;
    setConversionStats({ fps: 0, speed: '0x' });

    const { ffmpeg, fetchFile } = ffmpegRef.current;
    const inputFileName = 'input.mp4';
    const outputFileName = 'output.mp4';

    try {
      ffmpeg.FS('writeFile', inputFileName, await fetchFile(videoFile));

      await ffmpeg.run(
        '-i', inputFileName,
        '-b:v', targetBitrate,
        '-c:a', 'copy',
        outputFileName
      );

      const data = ffmpeg.FS('readFile', outputFileName);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
      setOutputUrl(url);
      ffmpeg.FS('unlink', inputFileName);
      ffmpeg.FS('unlink', outputFileName);
    } catch (error) {
      console.error('Conversion failed:', error);
      setLogs(prev => [...prev, `Error: Conversion failed. ${error}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setVideoFile(null);
    if(outputUrl) {
      URL.revokeObjectURL(outputUrl);
    }
    setOutputUrl(null);
    setProgress(0);
    setLogs([]);
    setIsProcessing(false);
  };
  
  const presets: ConversionPreset[] = [
    { name: 'Netflix HD (1080p)', bitrate: '6000k', description: 'Good for high-quality streaming.' },
    { name: 'Netflix 4K (2160p)', bitrate: '16000k', description: 'For ultra-high definition content.' },
    { name: 'Web Standard (720p)', bitrate: '2500k', description: 'Balanced quality for web embedding.' },
  ];

  if (!ffmpegReady) {
    if (loadingError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
          <div className="text-center max-w-2xl bg-red-900/20 border border-red-700 rounded-lg p-8 shadow-2xl shadow-black/30">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Initialization Failed</h2>
            <p className="text-red-200 text-left whitespace-pre-wrap">{loadingError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    const loadingPercentage = (loadingProgress * 100).toFixed(0);

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="flex flex-col items-center w-full max-w-sm px-4">
          <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg">Initializing Converter Engine...</p>
          <p className="mt-2 text-sm text-gray-400">This may take a moment.</p>
          
          {loadingProgress > 0 && loadingProgress < 1 && (
            <div className="w-full mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-500 h-2.5 rounded-full transition-width duration-150" 
                  style={{ width: `${loadingPercentage}%` }}>
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 mt-1">{loadingPercentage}% downloaded</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Offline Bitrate Converter
          </h1>
          <p className="mt-2 text-gray-400">Increase video bitrate directly in your browser. Powered by FFmpeg.wasm.</p>
        </header>

        <main className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/20 p-6 sm:p-8 space-y-8">
          {!outputUrl ? (
            <>
              <FileUploader onFileSelect={setVideoFile} disabled={isProcessing} videoFile={videoFile} />

              {videoFile && !isProcessing && (
                <>
                 <ConversionOptions
                    presets={presets}
                    onBitrateChange={setTargetBitrate}
                    currentBitrate={targetBitrate}
                  />
                  <div className="flex justify-center">
                    <button
                      onClick={handleConvert}
                      disabled={isProcessing}
                      className="w-full md:w-1/2 flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isProcessing ? 'Processing...' : 'Start Conversion'}
                    </button>
                  </div>
                </>
              )}

              {isProcessing && (
                <div className="space-y-4">
                  <ProgressBar progress={progress} stats={conversionStats} />
                  <LogViewer logs={logs} />
                </div>
              )}
            </>
          ) : (
            <ResultDisplay url={outputUrl} originalFileName={videoFile?.name || 'video.mp4'} onReset={handleReset} />
          )}
           <p className="text-center text-xs text-gray-500 pt-4">
            Note: Conversions happen in your browser and may be slow for large files. Your video is never uploaded to a server.
          </p>
        </main>
      </div>
    </div>
  );
};

export default App;