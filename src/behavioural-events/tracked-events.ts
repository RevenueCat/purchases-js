import type { EventProperties } from "./event";

export type TrackedEvent =
  | SDKInitializedEvent
  | CheckoutSessionStartEvent
  | BillingEmailEntryImpressionEvent
  | BillingEmailEntryDismissEvent
  | BillingEmailEntrySubmitEvent
  | BillingEmailEntrySuccessEvent
  | BillingEmailEntryErrorEvent;

export enum TrackedEventName {
  SDKInitialized = "sdk_initialized",
  CheckoutSessionStart = "checkout_session_start",
  BillingEmailEntryImpression = "billing_email_entry_impression",
  BillingEmailEntryDismiss = "billing_email_entry_dismiss",
  BillingEmailEntrySubmit = "billing_email_entry_submit",
  BillingEmailEntrySuccess = "billing_email_entry_success",
  BillingEmailEntryError = "billing_email_entry_error",
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
