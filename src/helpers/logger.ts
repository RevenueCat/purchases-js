import { LogLevel, type LogHandler } from "../entities/logging";

export class Logger {
  private static logLevel: LogLevel = LogLevel.Silent;
  private static logHandler: LogHandler | null = null;

  static setLogLevel(logLevel: LogLevel) {
    this.logLevel = logLevel;
  }

  static setLogHandler(handler: LogHandler | null) {
    this.logHandler = handler;
  }

  static log(message: string, logLevel: LogLevel = this.logLevel): void {
    const messageWithTag = `[Purchases] ${message}`;
    if (this.logLevel < logLevel || logLevel === LogLevel.Silent) {
      return;
    }

    // Use custom handler if available
    if (this.logHandler !== null) {
      this.logHandler(logLevel, messageWithTag);
      return;
    }

    // Fallback to console logging
    switch (logLevel) {
      case LogLevel.Error:
        console.error(messageWithTag);
        break;
      case LogLevel.Warn:
        console.warn(messageWithTag);
        break;
      case LogLevel.Info:
        console.info(messageWithTag);
        break;
      case LogLevel.Debug:
        console.debug(messageWithTag);
        break;
      case LogLevel.Verbose:
        console.debug(messageWithTag);
        break;
    }
  }

  static errorLog(message: string): void {
    this.log(message, LogLevel.Error);
  }

  static warnLog(message: string): void {
    this.log(message, LogLevel.Warn);
  }

  static infoLog(message: string): void {
    this.log(message, LogLevel.Info);
  }

  static debugLog(message: string): void {
    this.log(message, LogLevel.Debug);
  }

  static verboseLog(message: string): void {
    this.log(message, LogLevel.Verbose);
  }
}
