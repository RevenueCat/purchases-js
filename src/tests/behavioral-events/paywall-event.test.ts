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
    expect(json).not.toHaveProperty("display_mode");
    expect(json).not.toHaveProperty("dark_mode");
    expect(json).not.toHaveProperty("locale");
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
    expect(json).not.toHaveProperty("display_mode");
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
    if (json.type === "paywall_impression") {
      expect(json.dark_mode).toBe(false);
      expect(json.locale).toBe("en_US");
    }
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
});
