import { type PurchasesError } from "../entities/errors";
import { type Backend } from "../networking/backend";
import { type SubscribeResponse } from "../networking/responses/subscribe-response";
import {
  CheckoutSessionStatus,
  type CheckoutStatusError,
  CheckoutStatusErrorCodes,
  type CheckoutStatusResponse,
} from "../networking/responses/checkout-status-response";
import { type PurchaseOption } from "../entities/offerings";

export enum PurchaseFlowErrorCode {
  ErrorSettingUpPurchase = 0,
  ErrorChargingPayment = 1,
  UnknownError = 2,
  NetworkError = 3,
  StripeError = 4,
  MissingEmailError = 5,
}

export class PurchaseFlowError extends Error {
  constructor(
    public readonly errorCode: PurchaseFlowErrorCode,
    message?: string,
    public readonly underlyingErrorMessage?: string | null,
  ) {
    super(message);
  }
}

export class PurchaseOperationHelper {
  private operationSessionId: string | null = null;
  private readonly backend: Backend;
  private readonly maxNumberAttempts: number;
  private readonly waitMSBetweenAttempts = 1000;

  constructor(backend: Backend, maxNumberAttempts: number = 10) {
    this.backend = backend;
    this.maxNumberAttempts = maxNumberAttempts;
  }

  async startPurchase(
    appUserId: string,
    productId: string,
    purchaseOption: PurchaseOption | null | undefined,
    email: string,
    offeringIdentifier: string,
  ): Promise<SubscribeResponse> {
    const subscribeResponse = await this.backend.postSubscribe(
      appUserId,
      productId,
      email,
      offeringIdentifier,
      purchaseOption?.id,
    );
    this.operationSessionId = subscribeResponse.operation_session_id;
    return subscribeResponse;
  }

  async pollCurrentPurchaseForCompletion(): Promise<void> {
    const operationSessionId = this.operationSessionId;
    if (!operationSessionId) {
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "No purchase in progress",
      );
    }

    return new Promise<void>((resolve, reject) => {
      const checkForOperationStatus = (checkCount = 1) => {
        if (checkCount > this.maxNumberAttempts) {
          this.clearPurchaseInProgress();
          reject(
            new PurchaseFlowError(
              PurchaseFlowErrorCode.UnknownError,
              "Max attempts reached trying to get successful purchase status",
            ),
          );
          return;
        }
        this.backend
          .getCheckoutStatus(operationSessionId)
          .then((operationResponse: CheckoutStatusResponse) => {
            switch (operationResponse.operation.status) {
              case CheckoutSessionStatus.Started:
              case CheckoutSessionStatus.InProgress:
                setTimeout(
                  () => checkForOperationStatus(checkCount + 1),
                  this.waitMSBetweenAttempts,
                );
                break;
              case CheckoutSessionStatus.Succeeded:
                this.clearPurchaseInProgress();
                resolve();
                return;
              case CheckoutSessionStatus.Failed:
                this.clearPurchaseInProgress();
                this.handlePaymentError(
                  operationResponse.operation.error,
                  reject,
                );
            }
          })
          .catch((error: PurchasesError) => {
            reject(
              new PurchaseFlowError(
                PurchaseFlowErrorCode.NetworkError,
                error.message,
              ),
            );
          });
      };

      checkForOperationStatus();
    });
  }

  private clearPurchaseInProgress() {
    this.operationSessionId = null;
  }

  private handlePaymentError(
    error: CheckoutStatusError | undefined | null,
    reject: (error: PurchaseFlowError) => void,
  ) {
    if (error === null || error === undefined) {
      reject(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "Got an error status but error field is empty.",
        ),
      );
      return;
    }
    switch (error.code) {
      case CheckoutStatusErrorCodes.SetupIntentCreationFailed:
        reject(
          new PurchaseFlowError(
            PurchaseFlowErrorCode.ErrorSettingUpPurchase,
            "Setup intent creation failed",
          ),
        );
        return;
      case CheckoutStatusErrorCodes.PaymentMethodCreationFailed:
        reject(
          new PurchaseFlowError(
            PurchaseFlowErrorCode.ErrorSettingUpPurchase,
            "Payment method creation failed",
          ),
        );
        return;
      case CheckoutStatusErrorCodes.PaymentChargeFailed:
        reject(
          new PurchaseFlowError(
            PurchaseFlowErrorCode.ErrorChargingPayment,
            "Payment charge failed",
          ),
        );
        return;
    }
  }
}
