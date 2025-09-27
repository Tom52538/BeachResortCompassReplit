/**
 * Live GPS Logger for debugging re-routing issues in production
 * Provides detailed logging of route vs position analysis and routing engine decisions
 */

import { Coordinates, RouteResponse } from '@/types/navigation';

export interface LiveGpsLogEntry {
  timestamp: string;
  type: 'GPS_UPDATE' | 'ROUTE_ANALYSIS' | 'REROUTE_TRIGGER' | 'REROUTE_EXECUTION' | 'ROUTE_ENGINE';
  gpsPosition: Coordinates;
  routeInfo?: {
    currentRoute: RouteResponse | null;
    currentStep: number;
    totalSteps: number;
    distanceToRoute: number;
    isOffRoute: boolean;
    offRouteThreshold: number;
  };
  rerouteInfo?: {
    triggered: boolean;
    reason: string;
    shouldReroute: boolean;
    blockingCondition?: string;
    destination: Coordinates | null;
    useRealGPS: boolean;
    reroutingFlag: boolean;
    debounceTimer: boolean;
  };
  engineDecision?: {
    action: 'CONTINUE' | 'REROUTE' | 'BLOCKED' | 'ERROR';
    details: string;
    conditions: Record<string, any>;
  };
  error?: {
    message: string;
    stack?: string;
  };
}

class LiveGpsLogger {
  private logs: LiveGpsLogEntry[] = [];
  private maxLogs = 500; // Keep last 500 logs
  private logToConsole = true;
  private logToStorage = true;

  log(entry: Omit<LiveGpsLogEntry, 'timestamp'>): void {
    const fullEntry: LiveGpsLogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    // Add to memory logs
    this.logs.push(fullEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console logging with clear formatting
    if (this.logToConsole) {
      this.logToConsole_(fullEntry);
    }

    // Store in localStorage for persistence
    if (this.logToStorage && typeof window !== 'undefined') {
      this.saveToStorage(fullEntry);
    }
  }

  private logToConsole_(entry: LiveGpsLogEntry): void {
    const time = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `🔍 [${time}] ${entry.type}:`;

    switch (entry.type) {
      case 'GPS_UPDATE':
        console.log(`${prefix} GPS Position:`, {
          lat: entry.gpsPosition.lat.toFixed(6),
          lng: entry.gpsPosition.lng.toFixed(6)
        });
        break;

      case 'ROUTE_ANALYSIS':
        console.log(`${prefix} Route Analysis:`, {
          position: `${entry.gpsPosition.lat.toFixed(6)}, ${entry.gpsPosition.lng.toFixed(6)}`,
          distanceToRoute: `${entry.routeInfo?.distanceToRoute?.toFixed(1)}m`,
          isOffRoute: entry.routeInfo?.isOffRoute,
          threshold: `${entry.routeInfo?.offRouteThreshold}m`,
          currentStep: `${entry.routeInfo?.currentStep}/${entry.routeInfo?.totalSteps}`
        });
        break;

      case 'REROUTE_TRIGGER':
        console.log(`${prefix} Re-Route Trigger:`, {
          triggered: entry.rerouteInfo?.triggered,
          reason: entry.rerouteInfo?.reason,
          shouldReroute: entry.rerouteInfo?.shouldReroute,
          blockingCondition: entry.rerouteInfo?.blockingCondition || 'none',
          conditions: {
            useRealGPS: entry.rerouteInfo?.useRealGPS,
            hasDestination: !!entry.rerouteInfo?.destination,
            reroutingFlag: entry.rerouteInfo?.reroutingFlag,
            debounceTimer: entry.rerouteInfo?.debounceTimer
          }
        });
        break;

      case 'REROUTE_EXECUTION':
        console.log(`${prefix} Re-Route Execution:`, {
          from: `${entry.gpsPosition.lat.toFixed(6)}, ${entry.gpsPosition.lng.toFixed(6)}`,
          to: entry.rerouteInfo?.destination ? 
            `${entry.rerouteInfo.destination.lat.toFixed(6)}, ${entry.rerouteInfo.destination.lng.toFixed(6)}` : 
            'NO_DESTINATION',
          action: entry.engineDecision?.action,
          details: entry.engineDecision?.details
        });
        break;

      case 'ROUTE_ENGINE':
        console.log(`${prefix} Engine Decision:`, {
          action: entry.engineDecision?.action,
          details: entry.engineDecision?.details,
          conditions: entry.engineDecision?.conditions
        });
        break;
    }

    if (entry.error) {
      console.error(`${prefix} ERROR:`, entry.error.message);
    }
  }

  private saveToStorage(entry: LiveGpsLogEntry): void {
    try {
      const key = 'liveGpsLogs';
      const existingLogs = localStorage.getItem(key);
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      logs.push(entry);
      if (logs.length > this.maxLogs) {
        logs.shift();
      }
      
      localStorage.setItem(key, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save GPS log to storage:', error);
    }
  }

  getLogs(): LiveGpsLogEntry[] {
    return [...this.logs];
  }

  getLogsFromStorage(): LiveGpsLogEntry[] {
    try {
      const stored = localStorage.getItem('liveGpsLogs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load GPS logs from storage:', error);
      return [];
    }
  }

  generateReport(): string {
    const allLogs = [...this.getLogsFromStorage(), ...this.logs];
    const recent = allLogs.slice(-50); // Last 50 entries
    
    let report = '🔍 LIVE GPS DEBUGGING REPORT\n';
    report += '=' .repeat(50) + '\n\n';
    
    // Summary
    const gpsUpdates = recent.filter(l => l.type === 'GPS_UPDATE').length;
    const routeAnalyses = recent.filter(l => l.type === 'ROUTE_ANALYSIS').length;
    const rerouteTriggers = recent.filter(l => l.type === 'REROUTE_TRIGGER').length;
    const rerouteExecutions = recent.filter(l => l.type === 'REROUTE_EXECUTION').length;
    const errors = recent.filter(l => l.error).length;
    
    report += `SUMMARY (Last 50 entries):\n`;
    report += `- GPS Updates: ${gpsUpdates}\n`;
    report += `- Route Analyses: ${routeAnalyses}\n`;
    report += `- Re-Route Triggers: ${rerouteTriggers}\n`;
    report += `- Re-Route Executions: ${rerouteExecutions}\n`;
    report += `- Errors: ${errors}\n\n`;
    
    // Recent activity
    report += 'RECENT ACTIVITY:\n';
    report += '-'.repeat(30) + '\n';
    
    recent.slice(-20).forEach(log => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      report += `[${time}] ${log.type}`;
      
      if (log.type === 'ROUTE_ANALYSIS' && log.routeInfo) {
        report += ` - Distance: ${log.routeInfo.distanceToRoute?.toFixed(1)}m, Off-Route: ${log.routeInfo.isOffRoute}`;
      }
      
      if (log.type === 'REROUTE_TRIGGER' && log.rerouteInfo) {
        report += ` - Triggered: ${log.rerouteInfo.triggered}, Reason: ${log.rerouteInfo.reason}`;
        if (log.rerouteInfo.blockingCondition) {
          report += `, BLOCKED: ${log.rerouteInfo.blockingCondition}`;
        }
      }
      
      if (log.error) {
        report += ` - ERROR: ${log.error.message}`;
      }
      
      report += '\n';
    });
    
    return report;
  }

  clearLogs(): void {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('liveGpsLogs');
    }
  }

  // Export logs for external analysis
  exportLogs(): string {
    const allLogs = [...this.getLogsFromStorage(), ...this.logs];
    return JSON.stringify(allLogs, null, 2);
  }
}

// Global singleton instance
export const liveGpsLogger = new LiveGpsLogger();

// Make it available on window for debugging
if (typeof window !== 'undefined') {
  (window as any).liveGpsLogger = liveGpsLogger;
}