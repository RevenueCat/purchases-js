import { describe, expect, it, vi } from "vitest";
import {
  PaywallEvent,
  type PaywallCloseOrCancelEventData,
  type PaywallImpressionEventData,
} from "../../behavioural-events/paywall-event";

vi.mock("../../helpers/uuid-helper", () => ({
  generateUUID: () => "test-uuid-1234",
}));

const sessionFields = {
  appUserId: "user-123",
  sessionId: "session-456",
  offeringId: "offering-789",
  paywallRevision: 0,
  paywallRcPublicId: "pw-public-id" as string | null,
};

const impressionBase: PaywallImpressionEventData = {
  type: "paywall_impression",
  ...sessionFields,
  paywallRcPublicId: "pw-public-id",
  displayMode: "full_screen",
  darkMode: true,
  locale: "en_US",
};

describe("PaywallEvent", () => {
  it("serializes impression event with visual fields", () => {
    const event = new PaywallEvent({
      ...impressionBase,
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
    const data: PaywallCloseOrCancelEventData = {
      ...sessionFields,
      paywallRcPublicId: "pw-public-id",
      type: "paywall_close",
    };
    const event = new PaywallEvent(data);

    const json = event.toJSON();

    expect(json.type).toBe("paywall_close");
    expect(json.version).toBe(1);
    expect("display_mode" in json).toBe(false);
    expect("dark_mode" in json).toBe(false);
    expect("locale" in json).toBe(false);
  });

  it("serializes cancel event without visual fields", () => {
    const data: PaywallCloseOrCancelEventData = {
      ...sessionFields,
      paywallRcPublicId: "pw-public-id",
      type: "paywall_cancel",
    };
    const event = new PaywallEvent(data);

    const json = event.toJSON();

    expect(json.type).toBe("paywall_cancel");
    expect("display_mode" in json).toBe(false);
  });

  it("serializes impression dark_mode and locale from event data", () => {
    const event = new PaywallEvent({
      type: "paywall_impression",
      ...sessionFields,
      paywallRcPublicId: "pw-public-id",
      displayMode: "full_screen",
      darkMode: false,
      locale: "en_US",
    });

    const json = event.toJSON();
    expect(json.type).toBe("paywall_impression");
    if (json.type !== "paywall_impression") {
      throw new Error("expected impression payload");
    }
    expect(json.dark_mode).toBe(false);
    expect(json.locale).toBe("en_US");
  });

  it("handles null paywallRcPublicId", () => {
    const event = new PaywallEvent({
      type: "paywall_impression",
      ...sessionFields,
      paywallRcPublicId: null,
      displayMode: "full_screen",
      darkMode: false,
      locale: "en_US",
    });

    expect(event.toJSON().paywall_rc_public_id).toBeNull();
  });
});
