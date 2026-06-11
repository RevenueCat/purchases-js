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
  it("serializes impression event with visual fields and no context", () => {
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
    expect(json.presented_offering_context).toBeUndefined();
  });

  it("serializes full impression event with context and visual fields", () => {
    const event = new PaywallEvent({
      ...baseData,
      displayMode: "full_screen",
      darkMode: true,
      locale: "es_ES",
      presentedOfferingContext: {
        offeringIdentifier: "offering-789",
        placementIdentifier: "home_banner",
        targetingContext: { revision: 3, ruleId: "rule_abc123" },
      },
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
      presented_offering_context: {
        placement_identifier: "home_banner",
        targeting_revision: 3,
        targeting_rule_id: "rule_abc123",
      },
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
    expect(json).not.toHaveProperty("display_mode");
    expect(json).not.toHaveProperty("dark_mode");
    expect(json).not.toHaveProperty("locale");
  });

  it("serializes cancel event without visual fields", () => {
    const event = new PaywallEvent({
      ...baseData,
      type: "paywall_cancel",
    });

    const json = event.toJSON();

    expect(json.type).toBe("paywall_cancel");
    expect(json).not.toHaveProperty("display_mode");
  });

  it("defaults dark_mode to false and locale to en_US when displayMode set", () => {
    const event = new PaywallEvent({
      ...baseData,
      displayMode: "full_screen",
    });

    const json = event.toJSON();

    expect(json.type).toBe("paywall_impression");
    if (json.type === "paywall_impression") {
      expect(json.dark_mode).toBe(false);
      expect(json.locale).toBe("en_US");
    }
  });

  it("handles null paywallRcPublicId", () => {
    const event = new PaywallEvent({
      ...baseData,
      paywallRcPublicId: null,
    });

    expect(event.toJSON().paywall_rc_public_id).toBeNull();
  });

  it("serializes component interaction events with mapped interaction payload fields", () => {
    const event = new PaywallEvent({
      type: "paywall_component_interacted",
      appUserId: "user-123",
      sessionId: "session-456",
      offeringId: "offering-789",
      paywallRevision: 0,
      paywallRcPublicId: "pw-public-id",
      displayMode: "full_screen",
      darkMode: true,
      locale: "es_ES",
      componentType: "package",
      componentName: "Annual Package",
      componentValue: "$rc_annual",
      componentURL: "https://example.com/annual",
      originIndex: 0,
      destinationIndex: 1,
      originContextName: "Package Picker",
      destinationContextName: "Sticky Footer",
      defaultIndex: 0,
      originPackageId: "$rc_monthly",
      destinationPackageId: "$rc_annual",
      defaultPackageId: "$rc_monthly",
      originProductId: "monthly_product",
      destinationProductId: "annual_product",
      defaultProductId: "monthly_product",
      currentPackageId: "$rc_monthly",
      resultingPackageId: "$rc_annual",
      currentProductId: "monthly_product",
      resultingProductId: "annual_product",
    });

    expect(event.toJSON()).toEqual({
      type: "paywall_component_interacted",
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
      component_type: "package",
      component_name: "Annual Package",
      component_value: "$rc_annual",
      component_url: "https://example.com/annual",
      origin_index: 0,
      destination_index: 1,
      origin_context_name: "Package Picker",
      destination_context_name: "Sticky Footer",
      default_index: 0,
      origin_package_id: "$rc_monthly",
      destination_package_id: "$rc_annual",
      default_package_id: "$rc_monthly",
      origin_product_id: "monthly_product",
      destination_product_id: "annual_product",
      default_product_id: "monthly_product",
      current_package_id: "$rc_monthly",
      resulting_package_id: "$rc_annual",
      current_product_id: "monthly_product",
      resulting_product_id: "annual_product",
    });
  });

  it("includes presented_offering_context with placement and targeting", () => {
    const event = new PaywallEvent({
      ...baseData,
      presentedOfferingContext: {
        offeringIdentifier: "offering-789",
        placementIdentifier: "home_banner",
        targetingContext: { revision: 3, ruleId: "rule_abc123" },
      },
    });

    expect(event.toJSON().presented_offering_context).toEqual({
      placement_identifier: "home_banner",
      targeting_revision: 3,
      targeting_rule_id: "rule_abc123",
    });
  });

  it("includes presented_offering_context with placement only", () => {
    const event = new PaywallEvent({
      ...baseData,
      presentedOfferingContext: {
        offeringIdentifier: "offering-789",
        placementIdentifier: "home_banner",
        targetingContext: null,
      },
    });

    expect(event.toJSON().presented_offering_context).toEqual({
      placement_identifier: "home_banner",
    });
  });

  it("includes presented_offering_context with targeting only", () => {
    const event = new PaywallEvent({
      ...baseData,
      presentedOfferingContext: {
        offeringIdentifier: "offering-789",
        placementIdentifier: null,
        targetingContext: { revision: 7, ruleId: "rule_xyz" },
      },
    });

    expect(event.toJSON().presented_offering_context).toEqual({
      targeting_revision: 7,
      targeting_rule_id: "rule_xyz",
    });
  });

  it("omits presented_offering_context when no placement or targeting", () => {
    const event = new PaywallEvent({
      ...baseData,
      presentedOfferingContext: {
        offeringIdentifier: "offering-789",
        placementIdentifier: null,
        targetingContext: null,
      },
    });

    expect(event.toJSON().presented_offering_context).toBeUndefined();
  });

  it("omits presented_offering_context when placementIdentifier is empty string", () => {
    const event = new PaywallEvent({
      ...baseData,
      presentedOfferingContext: {
        offeringIdentifier: "offering-789",
        placementIdentifier: "",
        targetingContext: null,
      },
    });

    expect(event.toJSON().presented_offering_context).toBeUndefined();
  });

  it("omits presented_offering_context when not provided", () => {
    const event = new PaywallEvent(baseData);

    expect(event.toJSON().presented_offering_context).toBeUndefined();
  });

  it("JSON.stringify round-trip preserves presented_offering_context", () => {
    const event = new PaywallEvent({
      ...baseData,
      presentedOfferingContext: {
        offeringIdentifier: "offering-789",
        placementIdentifier: "home_banner",
        targetingContext: { revision: 3, ruleId: "rule_abc123" },
      },
    });

    const serialized = JSON.stringify(event.toJSON());
    const parsed = JSON.parse(serialized);

    expect(parsed.presented_offering_context).toEqual({
      placement_identifier: "home_banner",
      targeting_revision: 3,
      targeting_rule_id: "rule_abc123",
    });
  });

  it("JSON.stringify omits presented_offering_context when absent", () => {
    const event = new PaywallEvent(baseData);

    const serialized = JSON.stringify(event.toJSON());
    const parsed = JSON.parse(serialized);

    expect(parsed.presented_offering_context).toBeUndefined();
  });
});
