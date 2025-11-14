import React, { useEffect, useRef } from 'react';

interface LogViewerProps {
  logs: string[];
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Processing Logs</h3>
        <div ref={logContainerRef} className="h-48 bg-black/50 rounded-lg p-4 font-mono text-xs text-gray-300 overflow-y-auto">
        {logs.map((log, index) => (
            <p key={index} className="whitespace-pre-wrap break-words">{log}</p>
        ))}
        </div>
    </div>
  );
};

export default LogViewer;
