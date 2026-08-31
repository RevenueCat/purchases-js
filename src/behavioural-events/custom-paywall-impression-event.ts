import { generateUUID } from "../helpers/uuid-helper";

export interface CustomPaywallImpressionEventData {
  paywallId?: string;
  offeringId?: string;
  placementIdentifier?: string;
  targetingRevision?: number;
  targetingRuleId?: string;
}

type CustomPaywallImpressionEventPayload = {
  id: string;
  version: 1;
  type: "custom_paywall_impression";
  app_user_id: string;
  app_session_id?: string;
  timestamp: number;
  paywall_id?: string;
  offering_id?: string;
  presented_offering_context?: {
    placement_identifier?: string;
    targeting_revision?: number;
    targeting_rule_id?: string;
  };
};

export class CustomPaywallImpressionEvent {
  public readonly id: string;
  public readonly timestamp: number;
  public readonly data: CustomPaywallImpressionEventData;
  private readonly appUserId: string;
  private readonly appSessionId?: string;

  constructor(
    data: CustomPaywallImpressionEventData,
    appUserId: string,
    appSessionId?: string,
  ) {
    this.id = generateUUID();
    this.timestamp = Date.now();
    this.data = data;
    this.appUserId = appUserId;
    this.appSessionId = appSessionId;
  }

  public toJSON(): CustomPaywallImpressionEventPayload {
    const presentedOfferingContext =
      this.data.placementIdentifier !== undefined ||
      this.data.targetingRevision !== undefined ||
      this.data.targetingRuleId !== undefined
        ? {
            ...(this.data.placementIdentifier !== undefined
              ? { placement_identifier: this.data.placementIdentifier }
              : {}),
            ...(this.data.targetingRevision !== undefined
              ? {
                  targeting_revision: this.data.targetingRevision,
                }
              : {}),
            ...(this.data.targetingRuleId !== undefined
              ? { targeting_rule_id: this.data.targetingRuleId }
              : {}),
          }
        : undefined;

    return {
      id: this.id,
      version: 1,
      type: "custom_paywall_impression",
      app_user_id: this.appUserId,
      ...(this.appSessionId !== undefined
        ? { app_session_id: this.appSessionId }
        : {}),
      timestamp: this.timestamp,
      ...(this.data.paywallId !== undefined
        ? { paywall_id: this.data.paywallId }
        : {}),
      ...(this.data.offeringId !== undefined
        ? { offering_id: this.data.offeringId }
        : {}),
      ...(presentedOfferingContext !== undefined
        ? { presented_offering_context: presentedOfferingContext }
        : {}),
    };
  }
}
