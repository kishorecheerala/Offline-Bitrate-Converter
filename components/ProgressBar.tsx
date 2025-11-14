import React from 'react';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const percentage = (progress * 100).toFixed(0);

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-base font-medium text-blue-300">Converting Video</span>
        <span className="text-sm font-medium text-blue-300">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-4">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-200 ease-linear"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
