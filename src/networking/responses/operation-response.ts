export enum OperationSessionStatus {
  Started = "started",
  InProgress = "in_progress",
  Succeeded = "succeeded",
  Failed = "failed",
}

export enum OperationErrorCodes {
  SetupIntentCreationFailed = 1,
  PaymentMethodCreationFailed = 2,
  PaymentChargeFailed = 3,
}

export interface OperationError {
  readonly code: OperationErrorCodes;
  readonly message: string;
}

export interface OperationInnerResponse {
  readonly status: OperationSessionStatus;
  readonly isExpired: boolean;
  readonly error?: OperationError | null;
}

export interface OperationResponse {
  readonly operation: OperationInnerResponse;
}
