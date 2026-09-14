import { describe, expect, test, vi } from "vitest";
import {
  CustomPaywallImpressionEvent,
  type CustomPaywallImpressionEventData,
} from "../../behavioural-events/custom-paywall-impression-event";

vi.mock("../../helpers/uuid-helper", () => ({
  generateUUID: () => "test-uuid-1234",
}));

const baseData: CustomPaywallImpressionEventData = {
  paywallId: undefined,
};

describe("CustomPaywallImpressionEvent", () => {
  test("serializes an event with only its required fields", () => {
    const event = new CustomPaywallImpressionEvent(
      baseData,
      "user-123",
      "session-456",
    );

    expect(event.toJSON()).toEqual({
      id: "test-uuid-1234",
      version: 1,
      type: "custom_paywall_impression",
      app_user_id: "user-123",
      app_session_id: "session-456",
      timestamp: expect.any(Number),
    });
  });

  test("serializes optional paywall, offering, and presentation context", () => {
    const event = new CustomPaywallImpressionEvent(
      {
        ...baseData,
        paywallId: "custom-paywall",
        offeringId: "offering-789",
        placementIdentifier: "home_banner",
        targetingRevision: 3,
        targetingRuleId: "rule_abc123",
      },
      "user-123",
      "session-456",
    );

    expect(event.toJSON()).toEqual({
      id: "test-uuid-1234",
      version: 1,
      type: "custom_paywall_impression",
      app_user_id: "user-123",
      app_session_id: "session-456",
      timestamp: expect.any(Number),
      paywall_id: "custom-paywall",
      offering_id: "offering-789",
      presented_offering_context: {
        placement_identifier: "home_banner",
        targeting_revision: 3,
        targeting_rule_id: "rule_abc123",
      },
    });
  });

  test.each([
    {
      name: "placement only",
      data: { placementIdentifier: "home_banner" },
      presentedOfferingContext: { placement_identifier: "home_banner" },
    },
    {
      name: "targeting only",
      data: { targetingRevision: 3, targetingRuleId: "rule_abc123" },
      presentedOfferingContext: {
        targeting_revision: 3,
        targeting_rule_id: "rule_abc123",
      },
    },
  ])(
    "serializes partial presentation context: $name",
    ({ data, presentedOfferingContext }) => {
      const event = new CustomPaywallImpressionEvent(
        { ...baseData, ...data },
        "user-123",
        "session-456",
      );

      expect(event.toJSON()).toMatchObject({
        presented_offering_context: presentedOfferingContext,
      });
    },
  );

  test("omits empty presentation context", () => {
    const event = new CustomPaywallImpressionEvent(
      baseData,
      "user-123",
      "session-456",
    );

    expect(event.toJSON()).not.toHaveProperty("presented_offering_context");
  });
});
