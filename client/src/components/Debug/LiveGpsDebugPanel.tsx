/**
 * Live GPS Debug Panel for real-time debugging during live GPS tests
 * Shows route vs position analysis and routing engine decisions
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { liveGpsLogger, LiveGpsLogEntry } from '@/utils/liveGpsLogger';
import { Download, Trash2, Play, Pause, Eye, EyeOff, Copy, MessageSquare } from 'lucide-react';

interface LiveGpsDebugPanelProps {
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export const LiveGpsDebugPanel: React.FC<LiveGpsDebugPanelProps> = ({
  isVisible,
  onToggleVisibility
}) => {
  const [logs, setLogs] = useState<LiveGpsLogEntry[]>([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh logs every second
  useEffect(() => {
    if (isAutoRefresh && isVisible) {
      intervalRef.current = setInterval(() => {
        const latestLogs = liveGpsLogger.getLogs();
        setLogs(latestLogs.slice(-20)); // Show last 20 entries
        setLastUpdateTime(new Date().toLocaleTimeString());
        
        // Auto-scroll to bottom
        if (scrollAreaRef.current) {
          const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollElement) {
            scrollElement.scrollTop = scrollElement.scrollHeight;
          }
        }
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoRefresh, isVisible]);

  const downloadLogs = () => {
    const report = liveGpsLogger.generateReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gps-debug-report-${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportFullLogs = () => {
    const fullLogs = liveGpsLogger.exportLogs();
    const blob = new Blob([fullLogs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gps-full-logs-${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    liveGpsLogger.clearLogs();
    setLogs([]);
    setLastUpdateTime('Logs cleared');
  };

  const copyLogsForChat = async () => {
    const report = liveGpsLogger.generateReport();
    const chatFormat = `🛰️ **Live GPS Debug Report** 
📍 Generated: ${new Date().toLocaleTimeString()}
📊 Total Entries: ${liveGpsLogger.getLogs().length}

\`\`\`
${report}
\`\`\`

*Kopiert aus dem Live GPS Debug Panel für Chat-Analyse*`;

    try {
      await navigator.clipboard.writeText(chatFormat);
      console.log('✅ GPS DEBUG LOGS: Copied to clipboard for chat analysis');
      console.log('📋 CHAT PASTE READY:', chatFormat);
    } catch (err) {
      console.error('❌ Failed to copy to clipboard:', err);
      console.log('📋 MANUAL COPY - GPS DEBUG LOGS FOR CHAT:');
      console.log(chatFormat);
      console.log('📋 END OF LOGS - Copy the above text to chat');
    }
  };

  const outputLogsToConsole = () => {
    const report = liveGpsLogger.generateReport();
    console.log('🛰️ ===== LIVE GPS DEBUG LOGS FOR CHAT =====');
    console.log(report);
    console.log('🛰️ ===== END OF LOGS - COPY ABOVE =====');
    console.log('💡 TIP: Select and copy the text between the markers above to paste in chat');
  };

  const getLogTypeColor = (type: LiveGpsLogEntry['type']) => {
    switch (type) {
      case 'GPS_UPDATE': return 'bg-blue-100 text-blue-800';
      case 'ROUTE_ANALYSIS': return 'bg-green-100 text-green-800';
      case 'REROUTE_TRIGGER': return 'bg-yellow-100 text-yellow-800';
      case 'REROUTE_EXECUTION': return 'bg-purple-100 text-purple-800';
      case 'ROUTE_ENGINE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CONTINUE': return 'bg-green-100 text-green-800';
      case 'REROUTE': return 'bg-blue-100 text-blue-800';
      case 'BLOCKED': return 'bg-red-100 text-red-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isVisible) {
    return (
      <Button
        onClick={onToggleVisibility}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700"
        size="sm"
      >
        <Eye className="w-4 h-4 mr-2" />
        GPS Debug
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[500px] z-50 shadow-lg border-2 border-blue-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Live GPS Debug</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              {isAutoRefresh ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </Button>
            <Button
              onClick={onToggleVisibility}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <EyeOff className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Updated: {lastUpdateTime}</span>
          <span>{logs.length} entries</span>
        </div>
      </CardHeader>
      
      <CardContent className="p-2">
        <div className="flex gap-1 mb-2 flex-wrap">
          <Button onClick={copyLogsForChat} variant="outline" size="sm" className="h-6 text-xs bg-blue-50 hover:bg-blue-100">
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </Button>
          <Button onClick={outputLogsToConsole} variant="outline" size="sm" className="h-6 text-xs bg-green-50 hover:bg-green-100">
            <MessageSquare className="w-3 h-3 mr-1" />
            Console
          </Button>
          <Button onClick={downloadLogs} variant="outline" size="sm" className="h-6 text-xs">
            <Download className="w-3 h-3 mr-1" />
            Report
          </Button>
          <Button onClick={clearLogs} variant="outline" size="sm" className="h-6 text-xs">
            <Trash2 className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>

        <ScrollArea className="h-[380px]" ref={scrollAreaRef}>
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                No GPS logs yet. Start navigation to see debugging data.
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="border rounded p-2 text-xs bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <Badge className={`text-xs px-1 py-0 ${getLogTypeColor(log.type)}`}>
                      {log.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="text-gray-700 mb-1">
                    GPS: {log.gpsPosition.lat.toFixed(6)}, {log.gpsPosition.lng.toFixed(6)}
                  </div>

                  {log.routeInfo && (
                    <div className="bg-gray-50 p-1 rounded mb-1">
                      <div>Distance to route: {log.routeInfo.distanceToRoute?.toFixed(1)}m</div>
                      <div>Step: {log.routeInfo.currentStep}/{log.routeInfo.totalSteps}</div>
                      <div>Off-route: {log.routeInfo.isOffRoute ? 'YES' : 'NO'}</div>
                    </div>
                  )}

                  {log.rerouteInfo && (
                    <div className="bg-yellow-50 p-1 rounded mb-1">
                      <div>Triggered: {log.rerouteInfo.triggered ? 'YES' : 'NO'}</div>
                      <div>Should reroute: {log.rerouteInfo.shouldReroute ? 'YES' : 'NO'}</div>
                      <div>Real GPS: {log.rerouteInfo.useRealGPS ? 'YES' : 'NO'}</div>
                      {log.rerouteInfo.blockingCondition && (
                        <div className="text-red-600">BLOCKED: {log.rerouteInfo.blockingCondition}</div>
                      )}
                    </div>
                  )}

                  {log.engineDecision && (
                    <div className="bg-blue-50 p-1 rounded mb-1">
                      <Badge className={`text-xs px-1 py-0 mb-1 ${getActionColor(log.engineDecision.action)}`}>
                        {log.engineDecision.action}
                      </Badge>
                      <div>{log.engineDecision.details}</div>
                    </div>
                  )}

                  {log.error && (
                    <div className="bg-red-50 p-1 rounded text-red-700">
                      ERROR: {log.error.message}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};