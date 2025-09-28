import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Copy, Trash2 } from 'lucide-react';
import { exportableLogger } from '@/utils/exportableLogger';

export const ExportLogButton: React.FC = () => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    const success = await exportableLogger.copyToClipboard();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    exportableLogger.downloadLogs();
  };

  const handleClear = () => {
    exportableLogger.clear();
    console.log('🗑️ Logs cleared');
  };

  return (
    <div 
      className="fixed bottom-4 left-4 bg-black/80 backdrop-blur-md rounded-lg p-3 z-50"
      style={{
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div className="text-white text-sm mb-2 font-medium">GPS Log Export</div>
      <div className="flex gap-2">
        <Button
          onClick={handleCopy}
          size="sm"
          variant="outline"
          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
        >
          <Copy className="w-4 h-4 mr-1" />
          {copied ? 'Copied!' : 'Copy'}
        </Button>
        
        <Button
          onClick={handleDownload}
          size="sm"
          variant="outline"
          className="bg-green-600 hover:bg-green-700 text-white border-green-500"
        >
          <Download className="w-4 h-4 mr-1" />
          Download
        </Button>
        
        <Button
          onClick={handleClear}
          size="sm"
          variant="outline"
          className="bg-red-600 hover:bg-red-700 text-white border-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <div className="text-xs text-gray-300 mt-1">
        Logs: {exportableLogger.getLogCount()}
      </div>
    </div>
  );
};