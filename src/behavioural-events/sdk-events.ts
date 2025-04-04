import { type EventProperties } from "./event";

export type SDKEvent =
  | SDKInitializedEvent
  | CheckoutSessionStartEvent
  | CheckoutSessionFinishedEvent
  | CheckoutSessionClosedEvent
  | CheckoutFlowErrorEvent
  | CheckoutSessionErroredEvent
  | CheckoutBillingFormImpressionEvent
  | CheckoutBillingFormDismissEvent
  | CheckoutBillingFormSubmitEvent
  | CheckoutBillingFormSuccessEvent
  | CheckoutBillingFormErrorEvent
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
  CheckoutBillingFormImpression = "checkout_billing_form_impression",
  CheckoutBillingFormDismiss = "checkout_billing_form_dismiss",
  CheckoutBillingFormSubmit = "checkout_billing_form_submit",
  CheckoutBillingFormSuccess = "checkout_billing_form_success",
  CheckoutBillingFormError = "checkout_billing_form_error",
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

export interface CheckoutBillingFormImpressionEvent extends ISDKEvent {
  eventName: SDKEventName.CheckoutBillingFormImpression;
}

export interface CheckoutBillingFormDismissEvent extends ISDKEvent {
  eventName: SDKEventName.CheckoutBillingFormDismiss;
}

export interface CheckoutBillingFormSubmitEvent extends ISDKEvent {
  eventName: SDKEventName.CheckoutBillingFormSubmit;
}

export interface CheckoutBillingFormSuccessEvent extends ISDKEvent {
  eventName: SDKEventName.CheckoutBillingFormSuccess;
}

export interface CheckoutBillingFormErrorEvent extends ISDKEvent {
  eventName: SDKEventName.CheckoutBillingFormError;
  properties: {
    errorCode: string | null;
    errorMessage: string;
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
