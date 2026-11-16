import type { IEventsTracker } from "../behavioural-events/events-tracker";
import { ErrorCode, ErrorCodeUtils, PurchasesError } from "../entities/errors";
import type {
  ExternalPurchaseOutcome,
  ResumeExternalPurchaseParams,
} from "../entities/external-purchase";
import { toRedemptionInfo } from "../entities/redemption-info";
import { handleCheckoutSessionFailed } from "../helpers/checkout-error-handler";
import { PurchaseOperationHelper } from "../helpers/purchase-operation-helper";
import { CheckoutSessionStatus } from "../networking/responses/checkout-status-response";
import type { PurchaseParams } from "../entities/purchase-params";
import type { PurchaseResult } from "../entities/purchase-result";
import { getWindow } from "../helpers/browser-globals";
import { Logger } from "../helpers/logger";
import type { Backend } from "../networking/backend";
import type { ExternalCheckoutStartResponse } from "../networking/responses/checkout-start-response";
import {
  externalCheckoutUrl,
  validateExternalCheckoutUrls,
} from "./external-checkout";

interface ExternalPurchaseParams extends PurchaseParams {
  appUserId: string;
}

type ExternalPurchaseResolution =
  | { status: "completed"; purchase: Omit<PurchaseResult, "customerInfo"> }
  | Exclude<ExternalPurchaseOutcome, { status: "completed" }>;

export class ExternalPurchasesService {
  constructor(
    private readonly backend: Backend,
    private readonly eventsTracker: IEventsTracker,
  ) {}

  async resume(
    params: ResumeExternalPurchaseParams,
    appUserId: string,
  ): Promise<ExternalPurchaseResolution> {
    const waitTimeoutMs = params.waitTimeoutMs ?? 15000;
    if (
      typeof params.checkoutToken !== "string" ||
      !params.checkoutToken.trim() ||
      !Number.isFinite(waitTimeoutMs) ||
      waitTimeoutMs < 0
    ) {
      throw new PurchasesError(
        ErrorCode.ConfigurationError,
        "Provide a checkout token and a finite, nonnegative waitTimeoutMs.",
      );
    }
    const result = await PurchaseOperationHelper.pollOperationSession(
      this.backend,
      params.checkoutToken,
      { appUserId, waitTimeoutMs, stopOnExpiration: true },
    );
    if (result.status === "limit_reached") return { status: "pending" };
    if (result.status === "expired") return { status: "expired" };
    const response = result.response;
    const operation = response.operation;
    switch (operation.status) {
      case CheckoutSessionStatus.Succeeded: {
        const transactionId = operation.store_transaction_identifier;
        const productIdentifier = operation.product_identifier;
        const purchaseDate = new Date(operation.purchase_date ?? "");
        if (
          typeof transactionId !== "string" ||
          !transactionId ||
          typeof productIdentifier !== "string" ||
          !productIdentifier ||
          !Number.isFinite(purchaseDate.getTime())
        ) {
          throw new PurchasesError(
            ErrorCode.UnexpectedBackendResponseError,
            "Missing required fields in operation response.",
          );
        }
        return {
          status: "completed",
          purchase: {
            operationSessionId: params.checkoutToken,
            redemptionInfo: toRedemptionInfo(response),
            storeTransaction: {
              storeTransactionId: transactionId,
              productIdentifier,
              purchaseDate,
            },
            attributionMetadata: response.attribution_metadata,
          },
        };
      }
      case CheckoutSessionStatus.Failed: {
        let error!: PurchasesError;
        handleCheckoutSessionFailed(operation.error, (failure) => {
          error = new PurchasesError(
            ErrorCodeUtils.convertPurchaseFlowErrorCodeToErrorCode(
              failure.errorCode,
            ),
            failure.message,
          );
        });
        return { status: "failed", error };
      }
      default:
        throw new PurchasesError(
          ErrorCode.UnexpectedBackendResponseError,
          "Unknown checkout status.",
        );
    }
  }

  async purchase(params: ExternalPurchaseParams): Promise<PurchaseResult> {
    const { appUserId, rcPackage } = params;
    const product = rcPackage.product;
    const checkoutUrls = validateExternalCheckoutUrls(
      params.externalCheckoutUrl,
      params.externalCheckoutReturnUrl,
    );
    const operation =
      await this.backend.postCheckoutStart<ExternalCheckoutStartResponse>({
        appUserId,
        productId: product.identifier,
        purchaseOption: params.purchaseOption ?? product.defaultPurchaseOption,
        presentedOfferingContext: product.presentedOfferingContext,
        traceId: this.eventsTracker.getTraceId(),
        presentedStepId: params.workflowPurchaseContext?.stepId,
        urlParameters: params.workflowPurchaseContext?.urlParameters,
        paywallId: params.paywallId,
        paywallSessionId: params.paywallSessionId,
        customerEmail: params.customerEmail,
        metadata: params.metadata,
        locale: params.selectedLocale ?? params.defaultLocale,
        attributionMetadata: params.attributionMetadata,
        externalPurchaseTokenId: params.externalPurchaseTokenId,
      });
    if (
      typeof operation.operation_session_id !== "string" ||
      !operation.operation_session_id
    ) {
      throw new PurchasesError(
        ErrorCode.UnexpectedBackendResponseError,
        "Checkout start did not return an operation session ID.",
      );
    }
    const url = externalCheckoutUrl(
      checkoutUrls,
      appUserId,
      product.identifier,
      operation.operation_session_id,
    );
    void this.eventsTracker.flushAllEvents().catch((error) => {
      Logger.debugLog(
        `Failed to flush events before external checkout: ${error}`,
      );
    });
    getWindow().location.assign(url);
    // A redirect starts checkout; it does not provide a completed purchase result.
    return new Promise<PurchaseResult>(() => {});
  }
}
