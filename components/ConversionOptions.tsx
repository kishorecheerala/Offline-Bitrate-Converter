import React, { useState } from 'react';
import type { ConversionPreset } from '../types';

interface ConversionOptionsProps {
  presets: ConversionPreset[];
  onBitrateChange: (bitrate: string) => void;
  currentBitrate: string;
}

const ConversionOptions: React.FC<ConversionOptionsProps> = ({ presets, onBitrateChange, currentBitrate }) => {
  const [customBitrate, setCustomBitrate] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const handlePresetSelect = (bitrate: string) => {
    onBitrateChange(bitrate);
    setIsCustom(false);
    setCustomBitrate('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomBitrate(value);
    if (value && !isNaN(Number(value))) {
        onBitrateChange(`${value}k`);
    }
  };

  const handleCustomClick = () => {
    setIsCustom(true);
    if(customBitrate){
        onBitrateChange(`${customBitrate}k`);
    } else {
        onBitrateChange('');
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-center text-gray-300">Select Target Bitrate</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => handlePresetSelect(preset.bitrate)}
            className={`p-4 rounded-lg transition-all duration-200 text-left ${
              currentBitrate === preset.bitrate && !isCustom
                ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <p className="font-bold">{preset.name}</p>
            <p className="text-sm opacity-80">{preset.description}</p>
          </button>
        ))}
      </div>
       <div className="relative">
          <button 
             onClick={handleCustomClick}
             className={`w-full p-4 rounded-lg transition-all duration-200 text-left ${
              isCustom
                ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
                <p className="font-bold">Custom Bitrate</p>
          </button>
           {isCustom && (
            <div className="mt-4 flex items-center bg-gray-700 rounded-lg p-2">
                <input
                    type="number"
                    value={customBitrate}
                    onChange={handleCustomChange}
                    placeholder="e.g., 8000"
                    className="w-full bg-transparent text-white px-3 py-2 focus:outline-none"
                />
                <span className="text-gray-400 font-semibold pr-3">kbps</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default ConversionOptions;
