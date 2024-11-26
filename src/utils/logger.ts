type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  module: string;
  level?: LogLevel;
}

const LOG_PREFIX = '[Labulous]';

class Logger {
  private module: string;
  private static logLevel: LogLevel = 'debug'; // Always show debug logs for now

  constructor(options: LoggerOptions) {
    this.module = options.module;
  }

  private formatData(data?: any): string {
    if (!data) return '';
    try {
      if (typeof data === 'object') {
        return JSON.stringify(data, null, 2);
      }
      return String(data);
    } catch (error) {
      return '[Unserializable data]';
    }
  }

  private formatMessage(level: LogLevel, message: string, data?: any): [string, any] {
    const timestamp = new Date().toISOString();
    const formattedMessage = `${LOG_PREFIX}[${timestamp}][${level.toUpperCase()}][${this.module}] ${message}`;
    
    if (data === undefined) {
      return [formattedMessage, undefined];
    }

    if (data instanceof Error) {
      return [formattedMessage, {
        message: data.message,
        name: data.name,
        stack: data.stack
      }];
    }

    return [formattedMessage, data];
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(Logger.logLevel);
  }

  debug(message: string, data?: any) {
    if (this.shouldLog('debug')) {
      const [formattedMessage, formattedData] = this.formatMessage('debug', message, data);
      console.log(formattedMessage, formattedData || '');
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog('info')) {
      const [formattedMessage, formattedData] = this.formatMessage('info', message, data);
      console.log(formattedMessage, formattedData || '');
    }
  }

  warn(message: string, data?: any) {
    if (this.shouldLog('warn')) {
      const [formattedMessage, formattedData] = this.formatMessage('warn', message, data);
      console.warn(formattedMessage, formattedData || '');
    }
  }

  error(message: string, error?: any) {
    if (this.shouldLog('error')) {
      const [formattedMessage, formattedData] = this.formatMessage('error', message, error);
      console.error(formattedMessage, formattedData || '');
    }
  }

  static setLogLevel(level: LogLevel) {
    Logger.logLevel = level;
  }

  static getLogLevel(): LogLevel {
    return Logger.logLevel;
  }
}

export const createLogger = (options: LoggerOptions) => new Logger(options);
