import type { PresentedOfferingContext } from "../entities/offerings";
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
  originPackageId?: string;
  destinationPackageId?: string;
  defaultPackageId?: string;
  originProductId?: string;
  destinationProductId?: string;
  defaultProductId?: string;
  currentPackageId?: string;
  resultingPackageId?: string;
  currentProductId?: string;
  resultingProductId?: string;
}

interface BasePaywallEventData {
  appUserId: string;
  sessionId: string;
  offeringId: string;
  paywallRevision: number;
  paywallRcPublicId: string | null;
  presentedOfferingContext?: PresentedOfferingContext;
}

interface PaywallDisplayData {
  displayMode?: string;
  darkMode?: boolean;
  locale?: string;
}

export type PaywallImpressionEventData = BasePaywallEventData &
  PaywallDisplayData & {
    type: "paywall_impression";
  };

export type PaywallCloseOrCancelEventData = BasePaywallEventData & {
  type: "paywall_close" | "paywall_cancel";
};

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

type PresentedOfferingContextPayload = {
  placement_identifier?: string;
  targeting_revision?: number;
  targeting_rule_id?: string;
};

type CommonPaywallEventPayload = {
  version: 1;
  id: string;
  app_user_id: string;
  session_id: string;
  offering_id: string;
  paywall_revision: number;
  timestamp: number;
  paywall_rc_public_id: string | null;
  presented_offering_context?: PresentedOfferingContextPayload;
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

function toPresentedOfferingContextPayload(
  context: PresentedOfferingContext | undefined,
): PresentedOfferingContextPayload | undefined {
  if (!context) return undefined;
  if (!context.placementIdentifier && !context.targetingContext) {
    return undefined;
  }
  return {
    ...(context.placementIdentifier
      ? { placement_identifier: context.placementIdentifier }
      : {}),
    ...(context.targetingContext
      ? {
          targeting_revision: context.targetingContext.revision,
          targeting_rule_id: context.targetingContext.ruleId,
        }
      : {}),
  };
}

const toCommonPayload = (
  data: BasePaywallEventData,
  id: string,
  timestamp: number,
): CommonPaywallEventPayload => {
  const payload: CommonPaywallEventPayload = {
    version: 1,
    id,
    app_user_id: data.appUserId,
    session_id: data.sessionId,
    offering_id: data.offeringId,
    paywall_revision: data.paywallRevision,
    timestamp,
    paywall_rc_public_id: data.paywallRcPublicId,
  };
  const contextPayload = toPresentedOfferingContextPayload(
    data.presentedOfferingContext,
  );
  if (contextPayload) {
    payload.presented_offering_context = contextPayload;
  }
  return payload;
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
    const commonPayload = toCommonPayload(this.data, this.id, this.timestamp);

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
