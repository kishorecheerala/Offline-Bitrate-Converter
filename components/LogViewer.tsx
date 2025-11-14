import React, { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';


interface LogViewerProps {
  logs: string[];
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div>
        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex justify-between items-center text-sm font-semibold text-gray-400 mb-2 focus:outline-none"
            aria-expanded={!isCollapsed}
            aria-controls="log-container"
        >
            <span>Processing Logs</span>
            {isCollapsed ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />}
        </button>
        {!isCollapsed && (
            <div id="log-container" ref={logContainerRef} className="h-48 bg-black/50 rounded-lg p-4 font-mono text-xs text-gray-300 overflow-y-auto">
            {logs.map((log, index) => (
                <p key={index} className="whitespace-pre-wrap break-words">{log}</p>
            ))}
            </div>
        )}
    </div>
  );
};

export default LogViewer;
