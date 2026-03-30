import { describe, expect, it, vi } from "vitest";
import {
  PaywallEvent,
  type PaywallEventData,
} from "../../behavioural-events/paywall-event";

vi.mock("../../helpers/uuid-helper", () => ({
  generateUUID: () => "test-uuid-1234",
}));

const baseData: PaywallEventData = {
  type: "paywall_impression",
  appUserId: "user-123",
  sessionId: "session-456",
  offeringId: "offering-789",
  paywallRevision: 0,
  paywallRcPublicId: "pw-public-id",
};

describe("PaywallEvent", () => {
  it("serializes impression event with visual fields", () => {
    const event = new PaywallEvent({
      ...baseData,
      displayMode: "full_screen",
      darkMode: true,
      locale: "es_ES",
    });

    const json = event.toJSON();

    expect(json).toEqual({
      type: "paywall_impression",
      version: 1,
      id: "test-uuid-1234",
      app_user_id: "user-123",
      session_id: "session-456",
      offering_id: "offering-789",
      paywall_revision: 0,
      timestamp: expect.any(Number),
      paywall_rc_public_id: "pw-public-id",
      display_mode: "full_screen",
      dark_mode: true,
      locale: "es_ES",
    });
  });

  it("serializes close event without visual fields", () => {
    const event = new PaywallEvent({
      ...baseData,
      type: "paywall_close",
    });

    const json = event.toJSON();

    expect(json.type).toBe("paywall_close");
    expect(json.version).toBe(1);
    expect(json.display_mode).toBeUndefined();
    expect(json.dark_mode).toBeUndefined();
    expect(json.locale).toBeUndefined();
  });

  it("serializes cancel event without visual fields", () => {
    const event = new PaywallEvent({
      ...baseData,
      type: "paywall_cancel",
    });

    const json = event.toJSON();

    expect(json.type).toBe("paywall_cancel");
    expect(json.display_mode).toBeUndefined();
  });

  it("defaults dark_mode to false and locale to en_US when displayMode set", () => {
    const event = new PaywallEvent({
      ...baseData,
      displayMode: "full_screen",
    });

    const json = event.toJSON();

    expect(json.dark_mode).toBe(false);
    expect(json.locale).toBe("en_US");
  });

  it("handles null paywallRcPublicId", () => {
    const event = new PaywallEvent({
      ...baseData,
      paywallRcPublicId: null,
    });

    expect(event.toJSON().paywall_rc_public_id).toBeNull();
  });
});
