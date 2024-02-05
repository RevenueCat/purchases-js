import { ErrorCode, PurchasesError } from "../entities/errors";
import { Backend } from "../networking/backend";
import { SubscribeResponse } from "../networking/responses/subscribe-response";
import {
  CheckoutStatusError,
  CheckoutStatusErrorCodes,
  CheckoutStatusResponse,
  CheckoutSessionStatus,
} from "../networking/responses/checkout-status-response";

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
    email: string,
  ): Promise<SubscribeResponse> {
    const subscribeResponse = await this.backend.postSubscribe(
      appUserId,
      productId,
      email,
    );
    this.operationSessionId = subscribeResponse.operation_session_id;
    return subscribeResponse;
  }

  async pollCurrentPurchaseForCompletion(): Promise<void> {
    const operationSessionId = this.operationSessionId;
    if (!operationSessionId) {
      throw new PurchasesError(
        ErrorCode.PurchaseInvalidError,
        "Purchase not started before waiting for completion.",
      );
    }

    return new Promise<void>((resolve, reject) => {
      const checkForOperationStatus = (checkCount = 1) => {
        if (checkCount > this.maxNumberAttempts) {
          this.clearPurchaseInProgress();
          reject(
            new PurchasesError(
              ErrorCode.UnknownError,
              "Purchase status was not finished in given timeframe",
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
            reject(error);
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
    reject: (error: PurchasesError) => void,
  ) {
    if (error === null || error === undefined) {
      reject(
        new PurchasesError(
          ErrorCode.UnknownError,
          "Purchase failed for unknown reason.",
        ),
      );
      return;
    }
    switch (error.code) {
      case CheckoutStatusErrorCodes.SetupIntentCreationFailed:
        reject(
          new PurchasesError(
            ErrorCode.PaymentPendingError,
            "Purchase setup intent creation failed",
            error.message,
          ),
        );
        return;
      case CheckoutStatusErrorCodes.PaymentMethodCreationFailed:
        reject(
          new PurchasesError(
            ErrorCode.PaymentPendingError,
            "Purchase payment method creation failed",
            error.message,
          ),
        );
        return;
      case CheckoutStatusErrorCodes.PaymentChargeFailed:
        reject(
          new PurchasesError(
            ErrorCode.PaymentPendingError,
            "Purchase payment charge failed",
            error.message,
          ),
        );
        return;
    }
  }
}
