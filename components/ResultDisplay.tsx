import React from 'react';
import { DownloadIcon } from './icons/DownloadIcon';

interface ResultDisplayProps {
  url: string;
  originalFileName: string;
  onReset: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ url, originalFileName, onReset }) => {
  const getConvertedFileName = () => {
    const parts = originalFileName.split('.');
    const extension = parts.pop();
    const name = parts.join('.');
    return `${name}-converted.${extension}`;
  };

  return (
    <div className="text-center space-y-8 p-8 bg-gray-700/50 rounded-lg">
      <h2 className="text-3xl font-bold text-green-400">Conversion Complete!</h2>
      <p className="text-gray-300">Your video is ready for download.</p>
      
      <div className="flex flex-col md:flex-row items-center justify-center gap-4">
        <a
          href={url}
          download={getConvertedFileName()}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
        >
          <DownloadIcon className="w-6 h-6" />
          Download Video
        </a>
        
        <button
          onClick={onReset}
          className="w-full md:w-auto px-8 py-4 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 transition-colors"
        >
          Convert Another
        </button>
      </div>
    </div>
  );
};

export default ResultDisplay;
