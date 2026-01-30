import { generateUUID } from "./uuid-helper";
import { Logger } from "./logger";

const TRACE_ID_PREFIX = "rc_trace_id";
const TRACE_ID_TTL_MS = 60 * 60 * 1000; // 1 hour in milliseconds

interface StoredTraceId {
  trace_id: string;
  expires_at: number;
}

/**
 * Manages trace_id persistence in localStorage with TTL support.
 * Each trace_id is keyed by workflow identifier and has a 1-hour TTL
 * that refreshes on each interaction.
 * @internal
 */
export class TraceIdManager {
  private readonly workflowIdentifier?: string;
  private currentTraceId: string;

  constructor(workflowIdentifier?: string) {
    this.workflowIdentifier = workflowIdentifier;
    this.currentTraceId = this.initializeTraceId();
  }

  /**
   * Gets the current trace_id for this workflow.
   * Automatically refreshes the TTL on each call since accessing the trace_id
   * indicates an active session.
   */
  public getTraceId(): string {
    this.refreshTTL();
    return this.currentTraceId;
  }

  /**
   * Updates the TTL for the current trace_id, extending its lifetime by another hour.
   * Called automatically by getTraceId() to keep the trace_id "alive" during active use.
   */
  private refreshTTL(): void {
    if (!this.workflowIdentifier) {
      // No workflow identifier means no persistence (ephemeral trace_id)
      return;
    }

    try {
      const key = this.getStorageKey();
      const expiresAt = Date.now() + TRACE_ID_TTL_MS;
      const data: StoredTraceId = {
        trace_id: this.currentTraceId,
        expires_at: expiresAt,
      };
      localStorage.setItem(key, JSON.stringify(data));
      Logger.verboseLog(
        `Refreshed trace_id TTL for workflow ${this.workflowIdentifier}`,
      );
    } catch (error) {
      Logger.debugLog(
        `Failed to refresh trace_id TTL in localStorage: ${error}`,
      );
      // Continue without errors - trace_id remains valid even if TTL refresh fails
    }
  }

  /**
   * Initializes the trace_id by either loading from localStorage or generating a new one.
   */
  private initializeTraceId(): string {
    if (!this.workflowIdentifier) {
      // No workflow identifier means ephemeral trace_id (current behavior)
      Logger.verboseLog(
        "No workflow identifier provided, generating ephemeral trace_id",
      );
      return generateUUID();
    }

    const storedTraceId = this.loadFromStorage();
    if (storedTraceId) {
      Logger.verboseLog(
        `Loaded existing trace_id for workflow ${this.workflowIdentifier}`,
      );
      return storedTraceId;
    }

    // No valid stored trace_id, generate a new one and persist it
    const newTraceId = generateUUID();
    this.currentTraceId = newTraceId;
    this.refreshTTL();
    Logger.verboseLog(
      `Generated new trace_id for workflow ${this.workflowIdentifier}`,
    );
    return newTraceId;
  }

  /**
   * Attempts to load a valid trace_id from localStorage.
   * Returns null if no valid trace_id is found (expired or missing).
   */
  private loadFromStorage(): string | null {
    if (!this.workflowIdentifier) {
      return null;
    }

    try {
      const key = this.getStorageKey();
      const stored = localStorage.getItem(key);

      if (!stored) {
        Logger.verboseLog(
          `No stored trace_id found for workflow ${this.workflowIdentifier}`,
        );
        return null;
      }

      const data: StoredTraceId = JSON.parse(stored);

      // Validate stored data structure
      if (
        !data.trace_id ||
        typeof data.trace_id !== "string" ||
        typeof data.expires_at !== "number"
      ) {
        Logger.verboseLog(
          `Invalid stored trace_id data for workflow ${this.workflowIdentifier}`,
        );
        localStorage.removeItem(key);
        return null;
      }

      const now = Date.now();

      if (now > data.expires_at) {
        Logger.verboseLog(
          `Stored trace_id for workflow ${this.workflowIdentifier} has expired`,
        );
        // Clean up expired entry
        localStorage.removeItem(key);
        return null;
      }

      return data.trace_id;
    } catch (error) {
      Logger.debugLog(`Failed to load trace_id from localStorage: ${error}`);
      // Fall back to generating new trace_id if storage fails
      return null;
    }
  }

  /**
   * Generates the localStorage key for this workflow's trace_id.
   */
  private getStorageKey(): string {
    return `${TRACE_ID_PREFIX}_${this.workflowIdentifier}`;
  }

  /**
   * Clears the stored trace_id for this workflow from localStorage.
   * Useful for testing or manual cleanup.
   * @internal
   */
  public clear(): void {
    if (!this.workflowIdentifier) {
      return;
    }

    try {
      const key = this.getStorageKey();
      localStorage.removeItem(key);
      Logger.verboseLog(
        `Cleared trace_id for workflow ${this.workflowIdentifier}`,
      );
    } catch (error) {
      Logger.debugLog(`Failed to clear trace_id from localStorage: ${error}`);
    }
  }
}
