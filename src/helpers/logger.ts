import { LogLevel } from "../entities/log-level";

export class Logger {
  private static logLevel: LogLevel = LogLevel.Silent;

  static setLogLevel(logLevel: LogLevel) {
    this.logLevel = logLevel;
  }

  static log(message: string, logLevel: LogLevel = this.logLevel): void {
    const messageWithTag = `[Purchases] ${message}`;
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
      case LogLevel.Silent:
        // No-op
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
