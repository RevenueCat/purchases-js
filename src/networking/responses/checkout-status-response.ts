export enum CheckoutSessionStatus {
  Started = "started",
  InProgress = "in_progress",
  Succeeded = "succeeded",
  Failed = "failed",
}

export enum CheckoutStatusErrorCodes {
  SetupIntentCreationFailed = 1,
  PaymentMethodCreationFailed = 2,
  PaymentChargeFailed = 3,
  SetupIntentCompletionFailed = 4,
  AlreadyPurchased = 5,
}

export interface CheckoutStatusError {
  readonly code: CheckoutStatusErrorCodes | number;
  readonly message: string;
}

export interface CheckoutStatusRedemptionInfo {
  readonly redeem_url?: string | null;
}

export interface CheckoutStatusInnerResponse {
  readonly status: CheckoutSessionStatus;
  readonly is_expired: boolean;
  readonly error?: CheckoutStatusError | null;
  readonly redemption_info?: CheckoutStatusRedemptionInfo | null;
}

export interface CheckoutStatusResponse {
  readonly operation: CheckoutStatusInnerResponse;
}
