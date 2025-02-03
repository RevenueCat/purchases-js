import type { EventProperties } from "./event";

export type SDKEvent =
  | SDKInitializedEvent
  | CheckoutSessionStartEvent
  | CheckoutSessionFinishedEvent
  | CheckoutSessionClosedEvent
  | CheckoutSessionErroredEvent
  | BillingEmailEntryImpressionEvent
  | BillingEmailEntryDismissEvent
  | BillingEmailEntrySubmitEvent
  | BillingEmailEntrySuccessEvent
  | BillingEmailEntryErrorEvent
  | PurchaseSuccessfulImpressionEvent
  | PurchaseSuccessfulDismissEvent;

export enum TrackedEventName {
  SDKInitialized = "sdk_initialized",
  CheckoutSessionStart = "checkout_session_start",
  CheckoutSessionEnd = "checkout_session_end",
  BillingEmailEntryImpression = "billing_email_entry_impression",
  BillingEmailEntryDismiss = "billing_email_entry_dismiss",
  BillingEmailEntrySubmit = "billing_email_entry_submit",
  BillingEmailEntrySuccess = "billing_email_entry_success",
  BillingEmailEntryError = "billing_email_entry_error",
  PurchaseSuccessfulImpression = "purchase_successful_impression",
  PurchaseSuccessfulDismiss = "purchase_successful_dismiss",
}

interface IEvent {
  eventName: TrackedEventName;
}

export interface SDKInitializedEvent extends IEvent {
  eventName: TrackedEventName.SDKInitialized;
  properties: {
    sdkVersion: string;
  };
}

export interface CustomizationOptions extends EventProperties {
  colorButtonsPrimary: string;
  colorAccent: string;
  colorError: string;
  colorProductInfoBg: string;
  colorFormBg: string;
  colorPageBg: string;
  font: string;
  shapes: string;
  showProductDescription: boolean;
}

export interface CheckoutSessionStartEvent extends IEvent {
  eventName: TrackedEventName.CheckoutSessionStart;
  properties: {
    customizationOptions: CustomizationOptions | null;
    productInterval: string | null;
    productPrice: number;
    productCurrency: string;
    selectedProduct: string;
    selectedPackage: string;
    selectedPurchaseOption: string;
    customerEmailProvidedByDeveloper: boolean;
  };
}

export interface CheckoutSessionFinishedEvent extends IEvent {
  eventName: TrackedEventName.CheckoutSessionEnd;
  properties: {
    outcome: "finished";
    withRedemptionInfo: boolean;
  };
}

export interface CheckoutSessionClosedEvent extends IEvent {
  eventName: TrackedEventName.CheckoutSessionEnd;
  properties: {
    outcome: "closed";
  };
}

export interface CheckoutSessionErroredEvent extends IEvent {
  eventName: TrackedEventName.CheckoutSessionEnd;
  properties: {
    outcome: "errored";
    errorCode: number | null;
    errorMessage: string;
  };
}

export interface BillingEmailEntryImpressionEvent extends IEvent {
  eventName: TrackedEventName.BillingEmailEntryImpression;
}

export interface BillingEmailEntryDismissEvent extends IEvent {
  eventName: TrackedEventName.BillingEmailEntryDismiss;
}

export interface BillingEmailEntrySubmitEvent extends IEvent {
  eventName: TrackedEventName.BillingEmailEntrySubmit;
}

export interface BillingEmailEntrySuccessEvent extends IEvent {
  eventName: TrackedEventName.BillingEmailEntrySuccess;
}

export interface BillingEmailEntryErrorEvent extends IEvent {
  eventName: TrackedEventName.BillingEmailEntryError;
  properties: {
    errorCode: number | null;
    errorMessage: string;
  };
}

export interface PurchaseSuccessfulImpressionEvent extends IEvent {
  eventName: TrackedEventName.PurchaseSuccessfulImpression;
}

export interface PurchaseSuccessfulDismissEvent extends IEvent {
  eventName: TrackedEventName.PurchaseSuccessfulDismiss;
  properties: {
    buttonPressed: "go_back_to_app" | "close";
  };
}
