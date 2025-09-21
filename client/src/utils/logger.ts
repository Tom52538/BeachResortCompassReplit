export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  source: string;
}

class Logger {
  private logFile: string | null = null;
  private isNode: boolean = false;
  private fs: any = null;
  private path: any = null;

  constructor() {
    // Detect if we're running in Node.js environment (server-side)
    this.isNode = typeof window === 'undefined' && typeof process !== 'undefined';
    
    if (this.isNode) {
      try {
        // Dynamic import for Node.js modules to avoid bundling issues
        this.loadNodeModules();
      } catch (error) {
        console.warn('⚠️ Logger: File logging not available:', error);
      }
    } else {
      console.log('🌐 Logger: Browser environment detected - console logging only');
    }
  }

  private async loadNodeModules() {
    try {
      const fsModule = await import('fs');
      const pathModule = await import('path');
      this.fs = fsModule;
      this.path = pathModule;
      
      // Set up file logging for server/Node environment
      this.logFile = this.path.join(process.cwd(), 'navigation.log');
      console.log(`📁 Logger: File logging enabled - ${this.logFile}`);
    } catch (error) {
      console.warn('⚠️ Logger: Failed to load Node.js modules:', error);
    }
  }

  /**
   * Main logging function
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const source = this.getSource();
    
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      context,
      source
    };

    // Format for console output
    const consoleMessage = this.formatConsoleMessage(logEntry);
    
    // Log to console with appropriate method
    switch (level) {
      case 'DEBUG':
        console.debug(consoleMessage);
        break;
      case 'INFO':
        console.log(consoleMessage);
        break;
      case 'WARN':
        console.warn(consoleMessage);
        break;
      case 'ERROR':
        console.error(consoleMessage);
        break;
    }

    // Log to file if in Node environment
    if (this.isNode && this.logFile) {
      this.writeToFile(logEntry);
    }
  }

  /**
   * Format message for console output
   */
  private formatConsoleMessage(entry: LogEntry): string {
    const time = entry.timestamp.substring(11, 23); // HH:MM:SS.mmm
    const levelIcon = this.getLevelIcon(entry.level);
    
    let message = `${time} ${levelIcon} [${entry.source}] ${entry.message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      message += ` | ${JSON.stringify(entry.context)}`;
    }
    
    return message;
  }

  /**
   * Get emoji icon for log level
   */
  private getLevelIcon(level: LogLevel): string {
    switch (level) {
      case 'DEBUG': return '🔍';
      case 'INFO': return 'ℹ️ ';
      case 'WARN': return '⚠️ ';
      case 'ERROR': return '❌';
      default: return '📝';
    }
  }

  /**
   * Write log entry to file (Node.js only)
   */
  private writeToFile(entry: LogEntry): void {
    if (!this.logFile || !this.fs) return;

    try {
      const fileMessage = `${entry.timestamp} [${entry.level}] [${entry.source}] ${entry.message}`;
      const contextStr = entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : '';
      const fullMessage = fileMessage + contextStr + '\n';

      // Append to file asynchronously to avoid blocking
      this.fs.appendFile(this.logFile, fullMessage, (err: any) => {
        if (err) {
          console.error('Failed to write to log file:', err);
        }
      });
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  /**
   * Determine the source of the log call
   */
  private getSource(): string {
    if (this.isNode) {
      return 'SERVER';
    }
    
    // For client-side, try to get more specific source information
    const stack = new Error().stack;
    if (stack) {
      const lines = stack.split('\n');
      // Look for the calling function (skip current function and log wrapper)
      for (let i = 3; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('/src/')) {
          const match = line.match(/\/src\/([^\/]+)\/([^\/\?]+)/);
          if (match) {
            return `${match[1].toUpperCase()}/${match[2].replace('.tsx', '').replace('.ts', '')}`;
          }
        }
      }
    }
    
    return 'CLIENT';
  }

  /**
   * Convenience methods for different log levels
   */
  debug(message: string, context?: LogContext): void {
    this.log('DEBUG', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('INFO', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('WARN', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('ERROR', message, context);
  }

  /**
   * Clean old log entries from file (Node.js only)
   */
  cleanOldLogs(maxAgeHours: number = 24): void {
    if (!this.isNode || !this.logFile || !this.fs) return;

    try {
      if (this.fs.existsSync(this.logFile)) {
        const stats = this.fs.statSync(this.logFile);
        const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
        
        if (ageHours > maxAgeHours) {
          this.fs.unlinkSync(this.logFile);
          this.info('Log file cleaned due to age', { ageHours, maxAgeHours });
        }
      }
    } catch (error) {
      this.error('Failed to clean old logs', { error: error instanceof Error ? error.message : error });
    }
  }
}

// Create global logger instance
const logger = new Logger();

/**
 * Main logging function for easy import
 * @param level Log level ('DEBUG', 'INFO', 'WARN', 'ERROR')
 * @param message Log message
 * @param context Optional context object with additional information
 */
export function log(level: LogLevel, message: string, context?: LogContext): void {
  logger.log(level, message, context);
}

// Export convenience functions
export const debug = (message: string, context?: LogContext) => logger.debug(message, context);
export const info = (message: string, context?: LogContext) => logger.info(message, context);
export const warn = (message: string, context?: LogContext) => logger.warn(message, context);
export const error = (message: string, context?: LogContext) => logger.error(message, context);

// Export logger instance for advanced usage
export { logger };