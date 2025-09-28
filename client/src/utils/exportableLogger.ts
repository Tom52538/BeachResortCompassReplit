// Exportable GPS and Re-routing Logger
// Outputs structured logs that can be copied/exported for analysis

interface LogEntry {
  timestamp: string;
  type: 'GPS' | 'ROUTE_ANALYSIS' | 'REROUTE_TRIGGER' | 'REROUTE_DECISION' | 'ENGINE_STATE';
  data: any;
}

class ExportableLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 500; // Keep last 500 entries

  log(type: LogEntry['type'], data: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      type,
      data
    };

    this.logs.push(entry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output for live monitoring
    console.log(`[${type}] ${entry.timestamp}:`, data);
  }

  // Export all logs as structured text
  exportLogs(): string {
    const output = [
      '=== GPS & RE-ROUTING ANALYSIS LOG ===',
      `Generated: ${new Date().toISOString()}`,
      `Total Entries: ${this.logs.length}`,
      '=====================================\n'
    ];

    this.logs.forEach((entry, index) => {
      output.push(`[${index + 1}] ${entry.timestamp} - ${entry.type}`);
      output.push(JSON.stringify(entry.data, null, 2));
      output.push('---');
    });

    return output.join('\n');
  }

  // Export to downloadable file
  downloadLogs() {
    const logData = this.exportLogs();
    const blob = new Blob([logData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gps_rerouting_log_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Copy to clipboard
  async copyToClipboard(): Promise<boolean> {
    try {
      const logData = this.exportLogs();
      await navigator.clipboard.writeText(logData);
      return true;
    } catch (error) {
      console.error('Failed to copy logs:', error);
      return false;
    }
  }

  // Clear all logs
  clear() {
    this.logs = [];
    console.log('🗑️ Logger cleared');
  }

  // Get current log count
  getLogCount(): number {
    return this.logs.length;
  }

  // Get logs by type
  getLogsByType(type: LogEntry['type']): LogEntry[] {
    return this.logs.filter(log => log.type === type);
  }

  // Get recent logs (last N)
  getRecentLogs(count: number = 10): LogEntry[] {
    return this.logs.slice(-count);
  }
}

// Global logger instance
export const exportableLogger = new ExportableLogger();

// Browser console commands for easy access
if (typeof window !== 'undefined') {
  (window as any).exportLogs = () => exportableLogger.exportLogs();
  (window as any).downloadLogs = () => exportableLogger.downloadLogs();
  (window as any).copyLogs = () => exportableLogger.copyToClipboard();
  (window as any).clearLogs = () => exportableLogger.clear();
  
  console.log('🎯 GPS Logging Commands Available:');
  console.log('   exportLogs() - Get full log text');
  console.log('   downloadLogs() - Download log file');
  console.log('   copyLogs() - Copy to clipboard');
  console.log('   clearLogs() - Clear all logs');
}