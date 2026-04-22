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
      originPackageIdentifier: "$rc_monthly",
      destinationPackageIdentifier: "$rc_annual",
      defaultPackageIdentifier: "$rc_monthly",
      originProductIdentifier: "monthly_product",
      destinationProductIdentifier: "annual_product",
      defaultProductIdentifier: "monthly_product",
      currentPackageIdentifier: "$rc_monthly",
      resultingPackageIdentifier: "$rc_annual",
      currentProductIdentifier: "monthly_product",
      resultingProductIdentifier: "annual_product",
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
      origin_package_identifier: "$rc_monthly",
      destination_package_identifier: "$rc_annual",
      default_package_identifier: "$rc_monthly",
      origin_product_identifier: "monthly_product",
      destination_product_identifier: "annual_product",
      default_product_identifier: "monthly_product",
      current_package_identifier: "$rc_monthly",
      resulting_package_identifier: "$rc_annual",
      current_product_identifier: "monthly_product",
      resulting_product_identifier: "annual_product",
    });
  });
});
