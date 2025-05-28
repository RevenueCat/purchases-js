import { type EventProperties } from "./event";

export type SDKEvent =
  | SDKInitializedEvent
  | CheckoutSessionStartEvent
  | CheckoutSessionFinishedEvent
  | CheckoutSessionClosedEvent
  | CheckoutFlowErrorEvent
  | CheckoutSessionErroredEvent
  | CheckoutPaymentTaxCalculationEvent
  | CheckoutPaymentFormImpressionEvent
  | CheckoutPaymentFormDismissEvent
  | CheckoutPaymentFormSubmitEvent
  | CheckoutPaymentFormGatewayErrorEvent
  | CheckoutPaymentFormErrorEvent
  | CheckoutPurchaseSuccessfulImpressionEvent
  | CheckoutPurchaseSuccessfulDismissEvent;

export enum SDKEventName {
  SDKInitialized = "sdk_initialized",
  CheckoutSessionStart = "checkout_session_start",
  CheckoutSessionEnd = "checkout_session_end",
  CheckoutFlowError = "checkout_flow_error",
  CheckoutPaymentTaxCalculation = "checkout_payment_tax_calculation",
  CheckoutPaymentFormImpression = "checkout_payment_form_impression",
  CheckoutPaymentFormError = "checkout_payment_form_error",
  CheckoutPaymentFormDismiss = "checkout_payment_form_dismiss",
  CheckoutPaymentFormSubmit = "checkout_payment_form_submit",
  CheckoutPaymentFormGatewayError = "checkout_payment_form_gateway_error",
  CheckoutPurchaseSuccessfulImpression = "checkout_purchase_successful_impression",
  CheckoutPurchaseSuccessfulDismiss = "checkout_purchase_successful_dismiss",
}

interface ISDKEvent {
  eventName: SDKEventName;
  properties?: EventProperties;
}

export interface SDKInitializedEvent extends ISDKEvent {
  eventName: SDKEventName.SDKInitialized;
}

export interface CheckoutSessionStartEvent extends ISDKEvent {
  eventName: SDKEventName.CheckoutSessionStart;
  properties: {
    customizationColorButtonsPrimary: string | null;
    customizationColorAccent: string | null;
    customizationColorError: string | null;
    customizationColorProductInfoBg: string | null;
    customizationColorFormBg: string | null;
    customizationColorPageBg: string | null;
    customizationFont: string | null;
    customizationShapes: string | null;
    customizationShowProductDescription: boolean | null;
    productInterval: string | null;
    productPrice: number;
    productCurrency: string;
    selectedProductId: string;
    selectedPackageId: string;
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
    errorCode: string | null;
    errorMessage: string;
  };
}

export interface CheckoutFlowErrorEvent extends ISDKEvent {
  eventName: SDKEventName.CheckoutFlowError;
  properties: {
    errorCode: string | null;
    errorMessage: string;
  };
}

export interface CheckoutPaymentTaxCalculationEvent extends ISDKEvent {
  eventName: SDKEventName.CheckoutPaymentTaxCalculation;
  properties: {
    outcome: "disabled" | "failed" | "not-taxed" | "taxed";
    ui_element: "form" | "auto";
    error_code: string | null;
    tax_inclusive: boolean;
  };
}

export interface CheckoutPaymentFormImpressionEvent extends ISDKEvent {
  eventName: SDKEventName.CheckoutPaymentFormImpression;
}

export interface CheckoutPaymentFormErrorEvent extends ISDKEvent {
  eventName: SDKEventName.CheckoutPaymentFormError;
  properties: {
    errorCode: string | null;
    errorMessage: string;
  };
}

export interface CheckoutPaymentFormDismissEvent extends ISDKEvent {
  eventName: SDKEventName.CheckoutPaymentFormDismiss;
}

export interface CheckoutPaymentFormGatewayErrorEvent extends ISDKEvent {
  eventName: SDKEventName.CheckoutPaymentFormGatewayError;
  properties: {
    errorCode: string | null;
    errorMessage: string;
  };
}

export interface CheckoutPaymentFormSubmitEvent extends ISDKEvent {
  eventName: SDKEventName.CheckoutPaymentFormSubmit;
  properties: {
    selectedPaymentMethod: string | null;
  };
}

export interface CheckoutPurchaseSuccessfulImpressionEvent extends ISDKEvent {
  eventName: SDKEventName.CheckoutPurchaseSuccessfulImpression;
}

export interface CheckoutPurchaseSuccessfulDismissEvent extends ISDKEvent {
  eventName: SDKEventName.CheckoutPurchaseSuccessfulDismiss;
  properties: {
    ui_element: "go_back_to_app" | "close";
  };
}
