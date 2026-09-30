export type AppLogLevel = 'debug' | 'error' | 'info' | 'log' | 'warn';

export interface AppLogEntry {
  id: number;
  level: AppLogLevel;
  message: string;
  timestamp: string;
}

export const maxAppLogEntries = 1028;
const logEntries: AppLogEntry[] = [];
const listeners = new Set<() => void>();
let nextLogEntryId = 1;
let isInitialized = false;

const formatLogArgument = (argument: unknown): string => {
  if (argument instanceof Error) {
    return argument.stack || `${argument.name}: ${argument.message}`;
  }

  if (typeof argument === 'string') {
    return argument;
  }

  try {
    const serialized = JSON.stringify(argument);
    return serialized === undefined ? String(argument) : serialized;
  } catch {
    return String(argument);
  }
};

const appendLog = (level: AppLogLevel, argumentsToLog: unknown[]) => {
  logEntries.push({
    id: nextLogEntryId++,
    level,
    message: argumentsToLog.map(formatLogArgument).join(' '),
    timestamp: new Date().toISOString(),
  });

  if (logEntries.length > maxAppLogEntries) {
    logEntries.shift();
  }

  listeners.forEach((listener) => listener());
};

export const initializeAppLogs = () => {
  if (isInitialized) {
    return;
  }
  isInitialized = true;

  const levels: AppLogLevel[] = ['debug', 'error', 'info', 'log', 'warn'];
  levels.forEach((level) => {
    const originalMethod = console[level].bind(console);
    console[level] = (...argumentsToLog: unknown[]) => {
      appendLog(level, argumentsToLog);
      originalMethod(...argumentsToLog);
    };
  });
};

export const getAppLogs = (): readonly AppLogEntry[] => logEntries;

export const subscribeToAppLogs = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const clearAppLogs = () => {
  logEntries.length = 0;
  listeners.forEach((listener) => listener());
};
