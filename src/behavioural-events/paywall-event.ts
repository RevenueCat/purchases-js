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

interface PaywallDisplayData {
  displayMode?: string;
  darkMode?: boolean;
  locale?: string;
}

interface PaywallImpressionEventData
  extends BasePaywallEventData,
    PaywallDisplayData {
  type: "paywall_impression";
}

interface PaywallCloseOrCancelEventData extends BasePaywallEventData {
  type: "paywall_close" | "paywall_cancel";
}

export interface PaywallComponentInteractionEventData
  extends BasePaywallEventData,
    PaywallDisplayData,
    ComponentInteractionData {
  type: "paywall_component_interacted";
}

export type PaywallEventData =
  | PaywallImpressionEventData
  | PaywallCloseOrCancelEventData
  | PaywallComponentInteractionEventData;

type CommonPaywallEventPayload = {
  version: 1;
  id: string;
  app_user_id: string;
  session_id: string;
  offering_id: string;
  paywall_revision: number;
  timestamp: number;
  paywall_rc_public_id: string | null;
};

type PaywallDisplayPayload = {
  display_mode?: string;
  dark_mode?: boolean;
  locale?: string;
};

type PaywallComponentInteractionPayload = {
  component_type: ComponentInteractionType;
  component_value: string;
  component_name?: string;
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

type PaywallImpressionEventPayload = CommonPaywallEventPayload &
  PaywallDisplayPayload & {
    type: "paywall_impression";
  };

type PaywallCloseOrCancelEventPayload = CommonPaywallEventPayload & {
  type: "paywall_close" | "paywall_cancel";
};

type PaywallComponentInteractionEventPayload = CommonPaywallEventPayload &
  PaywallDisplayPayload &
  PaywallComponentInteractionPayload & {
    type: "paywall_component_interacted";
  };

type PaywallEventPayload =
  | PaywallImpressionEventPayload
  | PaywallCloseOrCancelEventPayload
  | PaywallComponentInteractionEventPayload;

const INTERACTION_FIELD_MAP = {
  componentType: "component_type",
  componentName: "component_name",
  componentValue: "component_value",
  componentURL: "component_url",
  originIndex: "origin_index",
  destinationIndex: "destination_index",
  originContextName: "origin_context_name",
  destinationContextName: "destination_context_name",
  defaultIndex: "default_index",
  originPackageIdentifier: "origin_package_id",
  destinationPackageIdentifier: "destination_package_id",
  defaultPackageIdentifier: "default_package_id",
  originProductIdentifier: "origin_product_id",
  destinationProductIdentifier: "destination_product_id",
  defaultProductIdentifier: "default_product_id",
  currentPackageIdentifier: "current_package_id",
  resultingPackageIdentifier: "resulting_package_id",
  currentProductIdentifier: "current_product_id",
  resultingProductIdentifier: "resulting_product_id",
} as const satisfies Record<
  keyof ComponentInteractionData,
  keyof PaywallComponentInteractionPayload
>;

const interactionFieldEntries = Object.entries(INTERACTION_FIELD_MAP) as Array<
  [
    keyof typeof INTERACTION_FIELD_MAP,
    (typeof INTERACTION_FIELD_MAP)[keyof typeof INTERACTION_FIELD_MAP],
  ]
>;

const toDisplayPayload = (data: PaywallDisplayData): PaywallDisplayPayload => {
  if (data.displayMode === undefined) {
    return {};
  }

  return {
    display_mode: data.displayMode,
    dark_mode: data.darkMode ?? false,
    locale: data.locale ?? "en_US",
  };
};

const toComponentInteractionPayload = (
  data: ComponentInteractionData,
): PaywallComponentInteractionPayload => {
  const payload: Partial<PaywallComponentInteractionPayload> = {};

  for (const [sourceKey, destinationKey] of interactionFieldEntries) {
    const value = data[sourceKey];
    if (value !== undefined) {
      Object.assign(payload, { [destinationKey]: value });
    }
  }

  return payload as PaywallComponentInteractionPayload;
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
    const commonPayload: CommonPaywallEventPayload = {
      version: 1,
      id: this.id,
      app_user_id: this.data.appUserId,
      session_id: this.data.sessionId,
      offering_id: this.data.offeringId,
      paywall_revision: this.data.paywallRevision,
      timestamp: this.timestamp,
      paywall_rc_public_id: this.data.paywallRcPublicId,
    };

    switch (this.data.type) {
      case "paywall_impression":
        return {
          type: this.data.type,
          ...commonPayload,
          ...toDisplayPayload(this.data),
        };
      case "paywall_close":
      case "paywall_cancel":
        return {
          type: this.data.type,
          ...commonPayload,
        };
      case "paywall_component_interacted":
        return {
          type: this.data.type,
          ...commonPayload,
          ...toDisplayPayload(this.data),
          ...toComponentInteractionPayload(this.data),
        };
    }
  }
}
