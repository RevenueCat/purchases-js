import type { PurchaseFlowError } from "../helpers/purchase-operation-helper";

export type CurrentView =
  | "needs-auth-info"
  | "processing-auth-info"
  | "needs-payment-info"
  | "polling-purchase-status"
  | "loading-payment-page"
  | "success"
  | "error";

export type ContinueHandlerParams = {
  authInfo?: { email: string };
  error?: PurchaseFlowError;
};
