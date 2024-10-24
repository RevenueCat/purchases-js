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

export interface CheckoutStatusInnerResponse {
  readonly status: CheckoutSessionStatus;
  readonly isExpired: boolean;
  readonly error?: CheckoutStatusError | null;
}

export interface CheckoutStatusResponse {
  readonly operation: CheckoutStatusInnerResponse;
}
