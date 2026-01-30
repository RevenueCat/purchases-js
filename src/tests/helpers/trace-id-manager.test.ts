import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TraceIdManager } from "../../helpers/trace-id-manager";

describe("TraceIdManager", () => {
  const workflowId = "test-workflow-123";
  const storageKey = `rc_trace_id_${workflowId}`;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllTimers();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("With workflowIdentifier", () => {
    it("persists trace_id across instances", () => {
      const manager1 = new TraceIdManager(workflowId);
      const traceId1 = manager1.getTraceId();

      const manager2 = new TraceIdManager(workflowId);
      const traceId2 = manager2.getTraceId();

      const manager3 = new TraceIdManager(workflowId);
      const traceId3 = manager3.getTraceId();

      expect(traceId1).toBe(traceId2);
      expect(traceId2).toBe(traceId3);
      expect(localStorage.getItem(storageKey)).toBeTruthy();
    });

    it("refreshes TTL on each getTraceId call", () => {
      vi.useFakeTimers();
      const manager = new TraceIdManager(workflowId);
      const traceId = manager.getTraceId();

      // Simulate activity every 30 minutes for 2.5 hours
      for (let i = 0; i < 5; i++) {
        vi.advanceTimersByTime(30 * 60 * 1000);
        manager.getTraceId(); // Each call refreshes TTL
      }

      // Should still have same trace_id after 2.5 hours of activity
      const manager2 = new TraceIdManager(workflowId);
      expect(manager2.getTraceId()).toBe(traceId);

      vi.useRealTimers();
    });

    it("generates new trace_id after 1 hour of inactivity", () => {
      vi.useFakeTimers();

      const manager1 = new TraceIdManager(workflowId);
      const traceId1 = manager1.getTraceId();

      // Advance time past TTL
      vi.advanceTimersByTime(61 * 60 * 1000);

      const manager2 = new TraceIdManager(workflowId);
      const traceId2 = manager2.getTraceId();

      expect(traceId2).not.toBe(traceId1);

      vi.useRealTimers();
    });

    it("clears stored trace_id", () => {
      const manager = new TraceIdManager(workflowId);
      manager.getTraceId();

      expect(localStorage.getItem(storageKey)).toBeTruthy();

      manager.clear();

      expect(localStorage.getItem(storageKey)).toBeNull();
    });
  });

  describe("Without workflowIdentifier", () => {
    it("generates ephemeral trace_id without persistence", () => {
      const manager1 = new TraceIdManager();
      const traceId1 = manager1.getTraceId();

      const manager2 = new TraceIdManager();
      const traceId2 = manager2.getTraceId();

      expect(traceId1).not.toBe(traceId2);
      expect(localStorage.length).toBe(0);
    });

    it("maintains same ephemeral trace_id across calls", () => {
      const manager = new TraceIdManager();
      const traceId1 = manager.getTraceId();
      const traceId2 = manager.getTraceId();
      const traceId3 = manager.getTraceId();

      expect(traceId1).toBe(traceId2);
      expect(traceId2).toBe(traceId3);
      expect(localStorage.length).toBe(0);
    });
  });

  describe("Multiple workflows", () => {
    it("maintains separate trace_ids per workflow", () => {
      const workflow1 = "workflow-1";
      const workflow2 = "workflow-2";
      const workflow3 = "workflow-3";

      const manager1 = new TraceIdManager(workflow1);
      const traceId1 = manager1.getTraceId();

      const manager2 = new TraceIdManager(workflow2);
      const traceId2 = manager2.getTraceId();

      const manager3 = new TraceIdManager(workflow3);
      const traceId3 = manager3.getTraceId();

      const uniqueTraceIds = new Set([traceId1, traceId2, traceId3]);
      expect(uniqueTraceIds.size).toBe(3);

      // Verify each workflow maintains its own trace_id
      expect(new TraceIdManager(workflow1).getTraceId()).toBe(traceId1);
      expect(new TraceIdManager(workflow2).getTraceId()).toBe(traceId2);
      expect(new TraceIdManager(workflow3).getTraceId()).toBe(traceId3);
    });
  });

  describe("Data corruption handling", () => {
    it("handles corrupted JSON data", () => {
      localStorage.setItem(storageKey, "invalid-json{{{");

      const manager = new TraceIdManager(workflowId);
      const traceId = manager.getTraceId();

      expect(traceId).toBeTruthy();
      // Should have valid data now
      expect(() =>
        JSON.parse(localStorage.getItem(storageKey) || ""),
      ).not.toThrow();
    });

    it("handles missing required fields", () => {
      const invalidData = { trace_id: "test-id" }; // missing expires_at
      localStorage.setItem(storageKey, JSON.stringify(invalidData));

      const manager = new TraceIdManager(workflowId);
      const traceId = manager.getTraceId();

      expect(traceId).not.toBe("test-id");
    });

    it("handles invalid expires_at type", () => {
      const invalidData = { trace_id: "test-id", expires_at: "not-a-number" };
      localStorage.setItem(storageKey, JSON.stringify(invalidData));

      const manager = new TraceIdManager(workflowId);
      const traceId = manager.getTraceId();

      expect(traceId).not.toBe("test-id");
    });
  });

  describe("localStorage availability", () => {
    it("continues functioning when localStorage throws on read", () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error("localStorage unavailable");
      });

      const manager1 = new TraceIdManager(workflowId);
      const traceId1 = manager1.getTraceId();

      expect(traceId1).toBeTruthy();

      // With localStorage unavailable, each instance generates ephemeral trace_id
      // Manager already has its trace_id, so we just verify it works
      expect(() => new TraceIdManager(workflowId).getTraceId()).not.toThrow();

      localStorage.getItem = originalGetItem;
    });

    it("continues functioning when localStorage throws on write", () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error("localStorage quota exceeded");
      });

      const manager = new TraceIdManager(workflowId);
      const traceId1 = manager.getTraceId();
      const traceId2 = manager.getTraceId();

      expect(traceId1).toBeTruthy();
      expect(traceId2).toBe(traceId1); // Same trace_id despite storage errors
      expect(() => manager.getTraceId()).not.toThrow();

      localStorage.setItem = originalSetItem;
    });
  });

  describe("Edge cases", () => {
    it("treats empty string as ephemeral", () => {
      const manager1 = new TraceIdManager("");
      const traceId1 = manager1.getTraceId();

      const manager2 = new TraceIdManager("");
      const traceId2 = manager2.getTraceId();

      expect(traceId1).not.toBe(traceId2);
      expect(localStorage.length).toBe(0);
    });

    it("treats undefined as ephemeral", () => {
      const manager1 = new TraceIdManager(undefined);
      const traceId1 = manager1.getTraceId();

      const manager2 = new TraceIdManager(undefined);
      const traceId2 = manager2.getTraceId();

      expect(traceId1).not.toBe(traceId2);
      expect(localStorage.length).toBe(0);
    });
  });
});
