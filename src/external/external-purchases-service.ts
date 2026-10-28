import type { IEventsTracker } from "../behavioural-events/events-tracker";
import { ErrorCode, PurchasesError } from "../entities/errors";
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

export class ExternalPurchasesService {
  constructor(
    private readonly backend: Backend,
    private readonly eventsTracker: IEventsTracker,
  ) {}

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
