export type CurrentView =
  | "present-offer"
  | "needs-auth-info"
  | "processing-auth-info"
  | "needs-payment-info"
  | "polling-purchase-status"
  | "loading"
  | "success"
  | "error";
