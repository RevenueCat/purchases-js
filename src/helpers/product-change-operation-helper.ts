import { type Backend } from "../networking/backend";
import {
  isSubscriptionChangeCheckoutStartResponse,
  type SubscriptionChangeCheckoutStartResponse,
} from "../networking/responses/subscription-change-response";
import type { CheckoutStartResponse } from "../networking/responses/checkout-start-response";
import type { ProductChangeResult } from "../entities/product-change-params";
import {
  type CheckoutStartParams,
  PurchaseFlowError,
  PurchaseFlowErrorCode,
} from "./purchase-operation-helper";
import { PurchasesError } from "../entities/errors";
import { type IEventsTracker } from "../behavioural-events/events-tracker";

type ProductChangeStartParams = CheckoutStartParams & {
  subscriptionId?: string;
  productIdentifier?: string;
  subscriberToken: string;
};

export type ProductChangeStartResult =
  | {
      mode: "subscription_change";
      response: SubscriptionChangeCheckoutStartResponse;
    }
  | {
      mode: "purchase";
      response: CheckoutStartResponse;
    };

export class ProductChangeOperationHelper {
  private operationSessionId: string | null = null;
  private startResponse: SubscriptionChangeCheckoutStartResponse | null = null;

  constructor(
    private readonly backend: Backend,
    private readonly eventsTracker: IEventsTracker,
  ) {}

  async start({
    subscriptionId,
    productIdentifier,
    subscriberToken,
    workflowPurchaseContext,
    ...checkoutParams
  }: ProductChangeStartParams): Promise<ProductChangeStartResult> {
    try {
      const response = await this.backend.postCheckoutStart({
        ...checkoutParams,
        traceId: this.eventsTracker.getTraceId(),
        presentedStepId: workflowPurchaseContext?.stepId,
        urlParameters: workflowPurchaseContext?.urlParameters,
        productChange: { subscriptionId, productIdentifier },
        subscriberToken,
      });

      if (isSubscriptionChangeCheckoutStartResponse(response)) {
        this.operationSessionId = response.operation_session_id;
        this.startResponse = response;
        return { mode: "subscription_change", response };
      }

      return { mode: "purchase", response };
    } catch (error) {
      throw this.toFlowError(
        error,
        "Failed to start product change checkout.",
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
      );
    }
  }

  setStartResponse(response: SubscriptionChangeCheckoutStartResponse): void {
    this.operationSessionId = response.operation_session_id;
    this.startResponse = response;
  }

  getStartResponse(): SubscriptionChangeCheckoutStartResponse | null {
    return this.startResponse;
  }

  async confirm(subscriberToken: string): Promise<ProductChangeResult> {
    if (!this.operationSessionId) {
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
        "No product change checkout session to confirm.",
      );
    }

    try {
      const response = await this.backend.postCheckoutConfirm(
        this.operationSessionId,
        subscriberToken,
      );
      return {
        operationSessionId: response.operation_session_id,
        changeType: response.change_type,
        newProductId: response.new_product_id,
      };
    } catch (error) {
      throw this.toFlowError(
        error,
        "Failed to confirm product change.",
        PurchaseFlowErrorCode.ErrorChargingPayment,
      );
    }
  }

  private toFlowError(
    error: unknown,
    fallbackMessage: string,
    defaultFlowErrorCode: PurchaseFlowErrorCode,
  ): PurchaseFlowError {
    if (error instanceof PurchaseFlowError) {
      return error;
    }
    if (error instanceof PurchasesError) {
      return PurchaseFlowError.fromPurchasesError(error, defaultFlowErrorCode);
    }
    return new PurchaseFlowError(
      PurchaseFlowErrorCode.UnknownError,
      fallbackMessage,
      error instanceof Error ? error.message : String(error),
    );
  }
}
