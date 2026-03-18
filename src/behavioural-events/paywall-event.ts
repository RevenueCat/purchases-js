import { generateUUID } from "../helpers/uuid-helper";

export type PaywallEventType =
  | "paywall_impression"
  | "paywall_close"
  | "paywall_cancel";

export interface PaywallEventData {
  type: PaywallEventType;
  appUserId: string;
  sessionId: string;
  offeringId: string;
  paywallRevision: number;
  paywallRcPublicId: string | null;
  displayMode?: string;
  darkMode?: boolean;
  locale?: string;
}

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

    if (this.data.displayMode !== undefined) {
      payload.display_mode = this.data.displayMode;
      payload.dark_mode = this.data.darkMode ?? false;
      payload.locale = this.data.locale ?? "en_US";
    }

    return payload;
  }
}
