import { ErrorCode, PurchasesError } from "../entities/errors";
import { getWindow } from "../helpers/browser-globals";
import {
  PurchaseFlowError,
  PurchaseFlowErrorCode,
} from "../helpers/purchase-operation-helper";
import type { Backend } from "../networking/backend";
import type {
  Package,
  PurchaseOption,
  PresentedOfferingContext,
  PurchaseMetadata,
} from "../main";
import type { CheckoutStatusResponse } from "../networking/responses/checkout-status-response";
import { CheckoutSessionStatus } from "../networking/responses/checkout-status-response";
import { toRedemptionInfo } from "../entities/redemption-info";
import type { OperationSessionSuccessfulResult } from "../helpers/purchase-operation-helper";
import { handleCheckoutSessionFailed } from "../helpers/checkout-error-handler";
import type { PayPalCheckoutStartResponse } from "../networking/responses/checkout-start-response";
import type { IEventsTracker } from "../behavioural-events/events-tracker";

interface PayPalPurchaseParams {
  rcPackage: Package;
  purchaseOption: PurchaseOption;
  appUserId: string;
  presentedOfferingIdentifier: string;
  customerEmail?: string;
  locale?: string;
}

interface PayPalPurchase {
  operationSessionId: string;
  orderId: string;
  approvalUrl: string;
  onCheckoutLoaded: () => void;
  params: PayPalPurchaseParams;
  onClose: () => void;
}

interface PayPalStartCheckoutParams {
  appUserId: string;
  productId: string;
  presentedOfferingContext: PresentedOfferingContext;
  purchaseOption: PurchaseOption;
  customerEmail?: string;
  metadata?: PurchaseMetadata;
}

export class PayPalService {
  private readonly backend: Backend;
  private readonly eventsTracker: IEventsTracker;
  private readonly maxNumberAttempts: number;
  private readonly waitMSBetweenAttempts = 1000;

  constructor(
    backend: Backend,
    eventsTracker: IEventsTracker,
    maxNumberAttempts: number = 10,
  ) {
    this.backend = backend;
    this.eventsTracker = eventsTracker;
    this.maxNumberAttempts = maxNumberAttempts;
  }

  async startCheckout({
    appUserId,
    productId,
    presentedOfferingContext,
    purchaseOption,
    customerEmail,
    metadata,
  }: PayPalStartCheckoutParams): Promise<PayPalCheckoutStartResponse> {
    try {
      const traceId = this.eventsTracker.getTraceId();
      const startResponse =
        await this.backend.postCheckoutStart<PayPalCheckoutStartResponse>(
          appUserId,
          productId,
          presentedOfferingContext,
          purchaseOption,
          traceId,
          customerEmail ?? undefined,
          metadata,
        );

      return startResponse;
    } catch (error) {
      if (error instanceof PurchasesError) {
        throw PurchaseFlowError.fromPurchasesError(
          error,
          PurchaseFlowErrorCode.ErrorSettingUpPurchase,
          error.errorCode === ErrorCode.InvalidCredentialsError,
        );
      } else {
        throw new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          `Error starting PayPal checkout: ${error}`,
        );
      }
    }
  }

  async purchase({
    operationSessionId,
    approvalUrl,
    onCheckoutLoaded,
    onClose,
  }: PayPalPurchase): Promise<OperationSessionSuccessfulResult> {
    return new Promise<OperationSessionSuccessfulResult>((resolve, reject) => {
      onCheckoutLoaded();

      // Open PayPal approval URL in a popup window
      const win = getWindow();
      const popupWidth = 450;
      const popupHeight = 600;
      const left = (win.screen.width - popupWidth) / 2;
      const top = (win.screen.height - popupHeight) / 2;
      const popup = win.open(
        approvalUrl,
        "paypal-checkout",
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes`,
      );

      if (!popup) {
        reject(
          new PurchaseFlowError(
            PurchaseFlowErrorCode.UnknownError,
            "Failed to open PayPal checkout window. Please allow popups for this site.",
          ),
        );
        return;
      }

      // Poll for popup closure (user cancelled or completed on PayPal side)
      const popupPollInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupPollInterval);
          // After the popup closes, poll the backend for status.
          // PayPal redirects back to the backend which captures the approval,
          // so the operation status will reflect the outcome.
          this.pollOperationStatus(operationSessionId)
            .then((result) => resolve(result))
            .catch((error) => {
              // If polling fails with a non-terminal status, the user likely
              // closed the popup before completing payment
              if (
                error instanceof PurchaseFlowError &&
                error.errorCode === PurchaseFlowErrorCode.UnknownError &&
                error.message?.includes("Max attempts reached")
              ) {
                onClose();
              } else {
                reject(error);
              }
            });
        }
      }, 500);
    });
  }

  private async pollOperationStatus(
    operationSessionId: string | null,
  ): Promise<OperationSessionSuccessfulResult> {
    if (!operationSessionId) {
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "No purchase in progress",
      );
    }

    return new Promise<OperationSessionSuccessfulResult>((resolve, reject) => {
      const checkForOperationStatus = (checkCount = 1) => {
        if (checkCount > this.maxNumberAttempts) {
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
            const storeTransactionIdentifier =
              operationResponse.operation.store_transaction_identifier;
            const productIdentifier =
              operationResponse.operation.product_identifier;
            const purchaseDate = operationResponse.operation.purchase_date
              ? isNaN(Date.parse(operationResponse.operation.purchase_date))
                ? null
                : new Date(operationResponse.operation.purchase_date)
              : null;
            switch (operationResponse.operation.status) {
              case CheckoutSessionStatus.Started:
              case CheckoutSessionStatus.InProgress:
                setTimeout(
                  () => checkForOperationStatus(checkCount + 1),
                  this.waitMSBetweenAttempts,
                );
                break;
              case CheckoutSessionStatus.Succeeded:
                if (
                  !storeTransactionIdentifier ||
                  !productIdentifier ||
                  !purchaseDate
                ) {
                  reject(
                    new PurchaseFlowError(
                      PurchaseFlowErrorCode.UnknownError,
                      "Missing required fields in operation response.",
                    ),
                  );
                  return;
                }
                resolve({
                  redemptionInfo: toRedemptionInfo(operationResponse),
                  operationSessionId: operationSessionId,
                  storeTransactionIdentifier: storeTransactionIdentifier ?? "",
                  productIdentifier: productIdentifier,
                  purchaseDate: purchaseDate ?? new Date(),
                });
                return;
              case CheckoutSessionStatus.Failed:
                handleCheckoutSessionFailed(
                  operationResponse.operation.error,
                  reject,
                );
            }
          })
          .catch((error) => {
            if (error instanceof PurchasesError) {
              const purchasesError = PurchaseFlowError.fromPurchasesError(
                error,
                PurchaseFlowErrorCode.NetworkError,
              );
              reject(purchasesError);
            } else {
              reject(
                new PurchaseFlowError(
                  PurchaseFlowErrorCode.NetworkError,
                  `Failed to get checkout status: ${error}`,
                ),
              );
            }
          });
      };

      checkForOperationStatus();
    });
  }
}
