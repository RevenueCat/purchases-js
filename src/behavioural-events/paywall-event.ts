import { generateUUID } from "../helpers/uuid-helper";
import type { ComponentInteractionData } from "@revenuecat/purchases-ui-js";

export type PaywallEventType =
  | "paywall_impression"
  | "paywall_close"
  | "paywall_cancel"
  | "paywall_component_interacted";

type PaywallSessionFields = {
  appUserId: string;
  sessionId: string;
  offeringId: string;
  paywallRevision: number;
  paywallRcPublicId: string | null;
};

type PaywallDisplayFields = {
  displayMode: string;
  darkMode: boolean;
  locale: string;
};

export type PaywallImpressionEventData = PaywallSessionFields &
  PaywallDisplayFields & {
    type: "paywall_impression";
  };

export type PaywallCloseOrCancelEventData = PaywallSessionFields & {
  type: "paywall_close" | "paywall_cancel";
};

export type PaywallComponentInteractionEventData = PaywallSessionFields &
  PaywallDisplayFields &
  ComponentInteractionData & {
    type: "paywall_component_interacted";
  };

export type PaywallEventData =
  | PaywallImpressionEventData
  | PaywallCloseOrCancelEventData
  | PaywallComponentInteractionEventData;

type CommonPaywallEventPayload = {
  version: number;
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
  component_type: ComponentInteractionData["componentType"];
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

export type PaywallEventPayload =
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
  originPackageId: "origin_package_id",
  destinationPackageId: "destination_package_id",
  defaultPackageId: "default_package_id",
  originProductId: "origin_product_id",
  destinationProductId: "destination_product_id",
  defaultProductId: "default_product_id",
  currentPackageId: "current_package_id",
  resultingPackageId: "resulting_package_id",
  currentProductId: "current_product_id",
  resultingProductId: "resulting_product_id",
} as const;

type InteractionFieldSource = Record<string, unknown>;

const toComponentInteractionPayload = (
  data: ComponentInteractionData,
): PaywallComponentInteractionPayload => {
  const source = data as unknown as InteractionFieldSource;
  const payload: Partial<PaywallComponentInteractionPayload> = {};

  for (const [sourceKey, destKey] of Object.entries(
    INTERACTION_FIELD_MAP,
  ) as Array<
    [
      keyof typeof INTERACTION_FIELD_MAP,
      keyof PaywallComponentInteractionPayload,
    ]
  >) {
    const value = source[sourceKey as string];
    if (value !== undefined) {
      Object.assign(payload, { [destKey]: value });
    }
  }

  return payload as PaywallComponentInteractionPayload;
};

const toDisplayPayload = (
  data: PaywallDisplayFields,
): PaywallDisplayPayload => {
  return {
    display_mode: data.displayMode,
    dark_mode: data.darkMode,
    locale: data.locale,
  };
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
