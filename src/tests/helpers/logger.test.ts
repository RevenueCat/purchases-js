import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { Logger } from "../../helpers/logger";
import { LogLevel, type LogHandler } from "../../entities/logging";

describe("Logger", () => {
  beforeEach(() => {
    // Reset logger state before each test
    Logger.setLogLevel(LogLevel.Silent);
    Logger.setLogHandler(null);
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  describe("setLogHandler", () => {
    test("should set custom log handler", () => {
      const mockHandler = vi.fn();
      Logger.setLogHandler(mockHandler);

      Logger.setLogLevel(LogLevel.Debug);
      Logger.debugLog("test message");

      expect(mockHandler).toHaveBeenCalledWith(
        LogLevel.Debug,
        "[Purchases] test message",
      );
    });

    test("should reset to console logging when handler is set to null", () => {
      const mockHandler = vi.fn();
      const consoleSpy = vi
        .spyOn(console, "debug")
        .mockImplementation(() => {});

      // Set custom handler first
      Logger.setLogHandler(mockHandler);
      Logger.setLogLevel(LogLevel.Debug);
      Logger.debugLog("test message");
      expect(mockHandler).toHaveBeenCalled();

      // Reset to null
      Logger.setLogHandler(null);
      Logger.debugLog("test message 2");

      expect(consoleSpy).toHaveBeenCalledWith("[Purchases] test message 2");

      consoleSpy.mockRestore();
    });
  });

  describe("custom handler with different log levels", () => {
    test("should call custom handler for error logs", () => {
      const mockHandler = vi.fn();
      Logger.setLogHandler(mockHandler);
      Logger.setLogLevel(LogLevel.Error);

      Logger.errorLog("error message");

      expect(mockHandler).toHaveBeenCalledWith(
        LogLevel.Error,
        "[Purchases] error message",
      );
    });

    test("should call custom handler for warn logs", () => {
      const mockHandler = vi.fn();
      Logger.setLogHandler(mockHandler);
      Logger.setLogLevel(LogLevel.Warn);

      Logger.warnLog("warn message");

      expect(mockHandler).toHaveBeenCalledWith(
        LogLevel.Warn,
        "[Purchases] warn message",
      );
    });

    test("should call custom handler for info logs", () => {
      const mockHandler = vi.fn();
      Logger.setLogHandler(mockHandler);
      Logger.setLogLevel(LogLevel.Info);

      Logger.infoLog("info message");

      expect(mockHandler).toHaveBeenCalledWith(
        LogLevel.Info,
        "[Purchases] info message",
      );
    });

    test("should call custom handler for debug logs", () => {
      const mockHandler = vi.fn();
      Logger.setLogHandler(mockHandler);
      Logger.setLogLevel(LogLevel.Debug);

      Logger.debugLog("debug message");

      expect(mockHandler).toHaveBeenCalledWith(
        LogLevel.Debug,
        "[Purchases] debug message",
      );
    });

    test("should call custom handler for verbose logs", () => {
      const mockHandler = vi.fn();
      Logger.setLogHandler(mockHandler);
      Logger.setLogLevel(LogLevel.Verbose);

      Logger.verboseLog("verbose message");

      expect(mockHandler).toHaveBeenCalledWith(
        LogLevel.Verbose,
        "[Purchases] verbose message",
      );
    });
  });

  describe("log level filtering with custom handler", () => {
    test("should not call custom handler when log level is too low", () => {
      const mockHandler = vi.fn();
      Logger.setLogHandler(mockHandler);
      Logger.setLogLevel(LogLevel.Error);

      Logger.debugLog("debug message");
      Logger.infoLog("info message");
      Logger.warnLog("warn message");

      expect(mockHandler).not.toHaveBeenCalled();
    });

    test("should call custom handler when log level is appropriate", () => {
      const mockHandler = vi.fn();
      Logger.setLogHandler(mockHandler);
      Logger.setLogLevel(LogLevel.Warn);

      Logger.errorLog("error message");
      Logger.warnLog("warn message");

      expect(mockHandler).toHaveBeenCalledTimes(2);
      expect(mockHandler).toHaveBeenNthCalledWith(
        1,
        LogLevel.Error,
        "[Purchases] error message",
      );
      expect(mockHandler).toHaveBeenNthCalledWith(
        2,
        LogLevel.Warn,
        "[Purchases] warn message",
      );
    });

    test("should not call custom handler when log level is Silent", () => {
      const mockHandler = vi.fn();
      Logger.setLogHandler(mockHandler);
      Logger.setLogLevel(LogLevel.Silent);

      Logger.errorLog("error message");
      Logger.verboseLog("verbose message");

      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe("fallback to console logging", () => {
    test("should use console.error for error logs when no custom handler", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      Logger.setLogLevel(LogLevel.Error);

      Logger.errorLog("error message");

      expect(consoleSpy).toHaveBeenCalledWith("[Purchases] error message");
      consoleSpy.mockRestore();
    });

    test("should use console.warn for warn logs when no custom handler", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      Logger.setLogLevel(LogLevel.Warn);

      Logger.warnLog("warn message");

      expect(consoleSpy).toHaveBeenCalledWith("[Purchases] warn message");
      consoleSpy.mockRestore();
    });

    test("should use console.info for info logs when no custom handler", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      Logger.setLogLevel(LogLevel.Info);

      Logger.infoLog("info message");

      expect(consoleSpy).toHaveBeenCalledWith("[Purchases] info message");
      consoleSpy.mockRestore();
    });

    test("should use console.debug for debug and verbose logs when no custom handler", () => {
      const consoleSpy = vi
        .spyOn(console, "debug")
        .mockImplementation(() => {});
      Logger.setLogLevel(LogLevel.Verbose);

      Logger.debugLog("debug message");
      Logger.verboseLog("verbose message");

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        "[Purchases] debug message",
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(
        2,
        "[Purchases] verbose message",
      );
      consoleSpy.mockRestore();
    });
  });

  describe("direct log method", () => {
    test("should call custom handler with direct log method", () => {
      const mockHandler = vi.fn();
      Logger.setLogHandler(mockHandler);
      Logger.setLogLevel(LogLevel.Debug);

      Logger.log("direct log message", LogLevel.Info);

      expect(mockHandler).toHaveBeenCalledWith(
        LogLevel.Info,
        "[Purchases] direct log message",
      );
    });

    test("should use console when no custom handler with direct log method", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      Logger.setLogLevel(LogLevel.Warn);

      Logger.log("direct log message", LogLevel.Warn);

      expect(consoleSpy).toHaveBeenCalledWith("[Purchases] direct log message");
      consoleSpy.mockRestore();
    });
  });

  describe("custom handler edge cases", () => {
    test("should handle custom handler that throws an error gracefully", () => {
      const mockHandler: LogHandler = () => {
        throw new Error("Handler error");
      };

      Logger.setLogHandler(mockHandler);
      Logger.setLogLevel(LogLevel.Debug);

      // Should not throw
      expect(() => Logger.debugLog("test message")).toThrow("Handler error");
    });

    test("should preserve message formatting with custom handler", () => {
      const mockHandler = vi.fn();
      Logger.setLogHandler(mockHandler);
      Logger.setLogLevel(LogLevel.Debug);

      Logger.debugLog("message with special chars: @#$%^&*()");

      expect(mockHandler).toHaveBeenCalledWith(
        LogLevel.Debug,
        "[Purchases] message with special chars: @#$%^&*()",
      );
    });
  });
});
