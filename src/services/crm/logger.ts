/**
 * CRM Service Logger
 * Logging and monitoring utilities for CRM operations
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  action: string;
  message: string;
  metadata?: Record<string, any>;
}

class CRMLogger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  log(level: LogLevel, action: string, message: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: 'CRMService',
      action,
      message,
      metadata,
    };

    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output for development
    const logMethod = this.getConsoleMethod(level);
    logMethod(`[${entry.timestamp}] [${entry.service}] [${action}] ${message}`, metadata || '');
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.ERROR:
        return console.error;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.DEBUG:
      default:
        return console.log;
    }
  }

  debug(action: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, action, message, metadata);
  }

  info(action: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, action, message, metadata);
  }

  warn(action: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, action, message, metadata);
  }

  error(action: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, action, message, metadata);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  getRecentErrors(count: number = 10): LogEntry[] {
    return this.logs
      .filter(log => log.level === LogLevel.ERROR)
      .slice(-count);
  }
}

export const logger = new CRMLogger();
