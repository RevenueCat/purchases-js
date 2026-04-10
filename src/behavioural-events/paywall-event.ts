import { generateUUID } from "../helpers/uuid-helper";

export type PaywallEventType =
  | "paywall_impression"
  | "paywall_close"
  | "paywall_cancel"
  | "paywall_component_interacted";

export type ComponentInteractionType =
  | "tab"
  | "switch"
  | "carousel"
  | "button"
  | "text"
  | "package"
  | "package_selection_sheet"
  | "purchase_button";

export interface ComponentInteractionData {
  componentType: ComponentInteractionType;
  componentName?: string;
  componentValue: string;
  componentURL?: string;
  originIndex?: number;
  destinationIndex?: number;
  originContextName?: string;
  destinationContextName?: string;
  defaultIndex?: number;
  originPackageIdentifier?: string;
  destinationPackageIdentifier?: string;
  defaultPackageIdentifier?: string;
  originProductIdentifier?: string;
  destinationProductIdentifier?: string;
  defaultProductIdentifier?: string;
  currentPackageIdentifier?: string;
  resultingPackageIdentifier?: string;
  currentProductIdentifier?: string;
  resultingProductIdentifier?: string;
}

interface BasePaywallEventData {
  appUserId: string;
  sessionId: string;
  offeringId: string;
  paywallRevision: number;
  paywallRcPublicId: string | null;
}

interface PaywallImpressionEventData extends BasePaywallEventData {
  type: "paywall_impression";
  displayMode?: string;
  darkMode?: boolean;
  locale?: string;
}

interface PaywallCloseOrCancelEventData extends BasePaywallEventData {
  type: "paywall_close" | "paywall_cancel";
}

export interface PaywallComponentInteractionEventData
  extends BasePaywallEventData,
    ComponentInteractionData {
  type: "paywall_component_interacted";
  displayMode?: string;
  darkMode?: boolean;
  locale?: string;
}

export type PaywallEventData =
  | PaywallImpressionEventData
  | PaywallCloseOrCancelEventData
  | PaywallComponentInteractionEventData;

type PaywallEventPayload = {
  type: string;
  version: number;
  id: string;
  app_user_id: string;
  session_id: string;
  offering_id: string;
  paywall_revision: number;
  timestamp: number;
  paywall_rc_public_id: string | null;
  display_mode?: string;
  dark_mode?: boolean;
  locale?: string;
  component_type?: string;
  component_name?: string;
  component_value?: string;
  component_url?: string;
  origin_index?: number;
  destination_index?: number;
  origin_context_name?: string;
  destination_context_name?: string;
  default_index?: number;
  origin_package_id?: string;
  destination_package_id?: string;
  default_package_id?: string;
  origin_product_id?: string;
  destination_product_id?: string;
  default_product_id?: string;
  current_package_id?: string;
  resulting_package_id?: string;
  current_product_id?: string;
  resulting_product_id?: string;
};

export class PaywallEvent {
  public readonly id: string;
  public readonly timestamp: number;
  public readonly data: PaywallEventData;

  constructor(data: PaywallEventData) {
    this.id = generateUUID();
    this.timestamp = Date.now();
    this.data = data;
  }

  public toJSON(): PaywallEventPayload {
    const payload: PaywallEventPayload = {
      type: this.data.type,
      version: 1,
      id: this.id,
      app_user_id: this.data.appUserId,
      session_id: this.data.sessionId,
      offering_id: this.data.offeringId,
      paywall_revision: this.data.paywallRevision,
      timestamp: this.timestamp,
      paywall_rc_public_id: this.data.paywallRcPublicId,
    };

    if ("displayMode" in this.data && this.data.displayMode !== undefined) {
      payload.display_mode = this.data.displayMode;
      payload.dark_mode = this.data.darkMode ?? false;
      payload.locale = this.data.locale ?? "en_US";
    }

    if (this.data.type === "paywall_component_interacted") {
      payload.component_type = this.data.componentType;
      payload.component_value = this.data.componentValue;

      if (this.data.componentName !== undefined) {
        payload.component_name = this.data.componentName;
      }
      if (this.data.componentURL !== undefined) {
        payload.component_url = this.data.componentURL;
      }
      if (this.data.originIndex !== undefined) {
        payload.origin_index = this.data.originIndex;
      }
      if (this.data.destinationIndex !== undefined) {
        payload.destination_index = this.data.destinationIndex;
      }
      if (this.data.originContextName !== undefined) {
        payload.origin_context_name = this.data.originContextName;
      }
      if (this.data.destinationContextName !== undefined) {
        payload.destination_context_name = this.data.destinationContextName;
      }
      if (this.data.defaultIndex !== undefined) {
        payload.default_index = this.data.defaultIndex;
      }
      if (this.data.originPackageIdentifier !== undefined) {
        payload.origin_package_id = this.data.originPackageIdentifier;
      }
      if (this.data.destinationPackageIdentifier !== undefined) {
        payload.destination_package_id = this.data.destinationPackageIdentifier;
      }
      if (this.data.defaultPackageIdentifier !== undefined) {
        payload.default_package_id = this.data.defaultPackageIdentifier;
      }
      if (this.data.originProductIdentifier !== undefined) {
        payload.origin_product_id = this.data.originProductIdentifier;
      }
      if (this.data.destinationProductIdentifier !== undefined) {
        payload.destination_product_id = this.data.destinationProductIdentifier;
      }
      if (this.data.defaultProductIdentifier !== undefined) {
        payload.default_product_id = this.data.defaultProductIdentifier;
      }
      if (this.data.currentPackageIdentifier !== undefined) {
        payload.current_package_id = this.data.currentPackageIdentifier;
      }
      if (this.data.resultingPackageIdentifier !== undefined) {
        payload.resulting_package_id = this.data.resultingPackageIdentifier;
      }
      if (this.data.currentProductIdentifier !== undefined) {
        payload.current_product_id = this.data.currentProductIdentifier;
      }
      if (this.data.resultingProductIdentifier !== undefined) {
        payload.resulting_product_id = this.data.resultingProductIdentifier;
      }
    }

    return payload;
  }
}
