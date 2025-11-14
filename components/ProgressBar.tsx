import React from 'react';

interface ProgressBarProps {
  progress: number;
  stats: {
    fps: number;
    speed: string;
  };
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, stats }) => {
  const percentage = (progress * 100).toFixed(0);

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-1">
        <div>
          <span className="text-base font-medium text-blue-300">Converting Video</span>
          <span className="text-sm font-medium text-blue-300 ml-2">{percentage}%</span>
        </div>
        <div className="text-xs text-gray-400 font-mono">
            {stats.fps > 0 && <span>FPS: {stats.fps}</span>}
            {stats.speed !== '0x' && <span className="ml-3">Speed: {stats.speed}</span>}
        </div>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-200 ease-linear"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
