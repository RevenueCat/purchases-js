import { ErrorCode, PurchasesError } from "../entities/errors";
import { Backend } from "../networking/backend";
import { SubscribeResponse } from "../networking/responses/subscribe-response";
import {
  OperationError,
  OperationErrorCodes,
  OperationSessionStatus,
} from "../networking/responses/operation-response";

export class PurchaseHelper {
  private operationSessionId: number | null = null;
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
      const checkForOperationStatus = async (checkCount = 1) => {
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
        const operationResponse =
          await this.backend.getOperation(operationSessionId);
        switch (operationResponse.operation.status) {
          case OperationSessionStatus.Started:
          case OperationSessionStatus.InProgress:
            setTimeout(
              () => checkForOperationStatus(checkCount + 1),
              this.waitMSBetweenAttempts,
            );
            break;
          case OperationSessionStatus.Succeeded:
            this.clearPurchaseInProgress();
            resolve();
            return;
          case OperationSessionStatus.Failed:
            this.clearPurchaseInProgress();
            this.handlePaymentError(operationResponse.operation.error, reject);
        }
      };

      checkForOperationStatus();
    });
  }

  private clearPurchaseInProgress() {
    this.operationSessionId = null;
  }

  private handlePaymentError(
    error: OperationError | undefined | null,
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
      case OperationErrorCodes.SetupIntentCreationFailed:
        reject(
          new PurchasesError(
            ErrorCode.PaymentPendingError,
            "Purchase setup intent creation failed",
            error.message,
          ),
        );
        return;
      case OperationErrorCodes.PaymentMethodCreationFailed:
        reject(
          new PurchasesError(
            ErrorCode.PaymentPendingError,
            "Purchase payment method creation failed",
            error.message,
          ),
        );
        return;
      case OperationErrorCodes.PaymentChargeFailed:
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
