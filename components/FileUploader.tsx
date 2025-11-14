import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { VideoIcon } from './icons/VideoIcon';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
  videoFile: File | null;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, disabled, videoFile }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };
  
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [disabled, onFileSelect]);


  if (videoFile) {
    return (
        <div className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <VideoIcon className="h-10 w-10 text-blue-400"/>
                <div>
                    <p className="font-semibold text-white truncate max-w-xs">{videoFile.name}</p>
                    <p className="text-sm text-gray-400">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors duration-200 ${
        isDragging ? 'border-blue-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <input
        type="file"
        id="file-upload"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileChange}
        accept="video/*"
        disabled={disabled}
      />
      <div className="flex flex-col items-center text-gray-400">
        <UploadIcon className="w-12 h-12 mb-4" />
        <p className="font-semibold text-lg text-gray-300">
          <span className="text-blue-400">Click to upload</span> or drag and drop
        </p>
        <p className="text-sm">MP4, MOV, WEBM or any video file</p>
      </div>
    </div>
  );
};

export default FileUploader;
