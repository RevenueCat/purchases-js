/**
 * Possible levels to log in the console.
 * @public
 */
export enum LogLevel {
  /**
   * No logs will be shown in the console.
   */
  Silent = 0,
  /**
   * Only errors will be shown in the console.
   */
  Error = 1,
  /**
   * Only warnings and errors will be shown in the console.
   */
  Warn = 2,
  /**
   * Only info, warnings, and errors will be shown in the console.
   */
  Info = 3,
  /**
   * Debug, info, warnings, and errors will be shown in the console.
   */
  Debug = 4,
  /**
   * All logs will be shown in the console.
   */
  Verbose = 5,
}
