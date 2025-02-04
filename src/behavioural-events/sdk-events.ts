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
  | PaymentEntryImpressionEvent
  | PurchaseSuccessfulImpressionEvent
  | PurchaseSuccessfulDismissEvent;

export enum SDKEventName {
  SDKInitialized = "sdk_initialized",
  CheckoutSessionStart = "checkout_session_start",
  CheckoutSessionEnd = "checkout_session_end",
  BillingEmailEntryImpression = "billing_email_entry_impression",
  BillingEmailEntryDismiss = "billing_email_entry_dismiss",
  BillingEmailEntrySubmit = "billing_email_entry_submit",
  BillingEmailEntrySuccess = "billing_email_entry_success",
  BillingEmailEntryError = "billing_email_entry_error",
  PaymentEntryImpression = "payment_entry_impression",
  PurchaseSuccessfulImpression = "purchase_successful_impression",
  PurchaseSuccessfulDismiss = "purchase_successful_dismiss",
}

interface ISDKEvent {
  eventName: SDKEventName;
}

export interface SDKInitializedEvent extends ISDKEvent {
  eventName: SDKEventName.SDKInitialized;
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

export interface CheckoutSessionStartEvent extends ISDKEvent {
  eventName: SDKEventName.CheckoutSessionStart;
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

export interface CheckoutSessionFinishedEvent extends ISDKEvent {
  eventName: SDKEventName.CheckoutSessionEnd;
  properties: {
    outcome: "finished";
    withRedemptionInfo: boolean;
  };
}

export interface CheckoutSessionClosedEvent extends ISDKEvent {
  eventName: SDKEventName.CheckoutSessionEnd;
  properties: {
    outcome: "closed";
  };
}

export interface CheckoutSessionErroredEvent extends ISDKEvent {
  eventName: SDKEventName.CheckoutSessionEnd;
  properties: {
    outcome: "errored";
    errorCode: number | null;
    errorMessage: string;
  };
}

export interface BillingEmailEntryImpressionEvent extends ISDKEvent {
  eventName: SDKEventName.BillingEmailEntryImpression;
}

export interface BillingEmailEntryDismissEvent extends ISDKEvent {
  eventName: SDKEventName.BillingEmailEntryDismiss;
}

export interface BillingEmailEntrySubmitEvent extends ISDKEvent {
  eventName: SDKEventName.BillingEmailEntrySubmit;
}

export interface BillingEmailEntrySuccessEvent extends ISDKEvent {
  eventName: SDKEventName.BillingEmailEntrySuccess;
}

export interface BillingEmailEntryErrorEvent extends ISDKEvent {
  eventName: SDKEventName.BillingEmailEntryError;
  properties: {
    errorCode: number | null;
    errorMessage: string;
  };
}

export interface PaymentEntryImpressionEvent extends ISDKEvent {
  eventName: SDKEventName.PaymentEntryImpression;
}

export interface PurchaseSuccessfulImpressionEvent extends ISDKEvent {
  eventName: SDKEventName.PurchaseSuccessfulImpression;
}

export interface PurchaseSuccessfulDismissEvent extends ISDKEvent {
  eventName: SDKEventName.PurchaseSuccessfulDismiss;
  properties: {
    buttonPressed: "go_back_to_app" | "close";
  };
}
