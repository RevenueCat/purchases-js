import { type Backend } from "../networking/backend";
import type { SubscriptionChangeCheckoutStartResponse } from "../networking/responses/subscription-change-response";
import type { ProductChangeResult } from "../entities/product-change-params";
import {
  PurchaseFlowError,
  PurchaseFlowErrorCode,
} from "./purchase-operation-helper";
import { PurchasesError } from "../entities/errors";

export class ProductChangeOperationHelper {
  private operationSessionId: string | null = null;
  private startResponse: SubscriptionChangeCheckoutStartResponse | null = null;

  constructor(private readonly backend: Backend) {}

  async start(
    newProductId: string,
    fromProductIdentifier: string | undefined,
    subscriberToken: string,
  ): Promise<SubscriptionChangeCheckoutStartResponse> {
    try {
      const response = await this.backend.postSubscriptionChangeCheckoutStart(
        newProductId,
        fromProductIdentifier,
        subscriberToken,
      );
      this.operationSessionId = response.operation_session_id;
      this.startResponse = response;
      return response;
    } catch (error) {
      throw this.toFlowError(
        error,
        "Failed to start product change checkout.",
        PurchaseFlowErrorCode.ErrorSettingUpPurchase,
      );
    }
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
      const response = await this.backend.postSubscriptionChangeCheckoutConfirm(
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
