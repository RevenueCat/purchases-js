import type { PurchaseFlowError } from "../helpers/purchase-operation-helper";

export type CurrentPage =
  | "email-entry"
  | "email-entry-processing"
  | "payment-entry-loading"
  | "payment-entry"
  | "payment-entry-processing"
  | "success"
  | "error";

export type ContinueHandlerParams = {
  authInfo?: { email: string };
  error?: PurchaseFlowError;
};
