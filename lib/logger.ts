export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  level: LogLevel;
  message: string;
  route?: string;
  tenant?: string;
  durationMs?: number;
  error?: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

export function log(level: LogLevel, message: string, meta?: Partial<LogEntry>): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta
  };

  const line = formatLog(entry);

  switch (level) {
    case 'error':
      console.error(line);
      break;
    case 'warn':
      console.warn(line);
      break;
    case 'debug':
      console.debug(line);
      break;
    default:
      console.log(line);
  }
}

export const logger = {
  info: (msg: string, meta?: Partial<LogEntry>) => log('info', msg, meta),
  warn: (msg: string, meta?: Partial<LogEntry>) => log('warn', msg, meta),
  error: (msg: string, meta?: Partial<LogEntry>) => log('error', msg, meta),
  debug: (msg: string, meta?: Partial<LogEntry>) => log('debug', msg, meta)
};
