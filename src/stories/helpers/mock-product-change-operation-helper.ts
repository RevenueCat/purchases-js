import type { ProductChangeResult } from "../../entities/product-change-params";
import type { ProductChangeOperationHelper } from "../../helpers/product-change-operation-helper";
import {
  PurchaseFlowError,
  PurchaseFlowErrorCode,
} from "../../helpers/purchase-operation-helper";
import type { SubscriptionChangeCheckoutStartResponse } from "../../networking/responses/subscription-change-response";

type StartOutcome =
  | { type: "success"; data: SubscriptionChangeCheckoutStartResponse }
  | { type: "error"; message: string }
  | { type: "pending" };

type ConfirmOutcome =
  | { type: "success"; data: ProductChangeResult }
  | { type: "error"; message: string }
  | { type: "pending" };

/**
 * Storybook-only stub of {@link ProductChangeOperationHelper}.
 * Avoids network calls so each upgrade-checkout UI state can be rendered.
 */
export function createMockProductChangeOperationHelper(options: {
  start: StartOutcome;
  confirm?: ConfirmOutcome;
}): ProductChangeOperationHelper {
  const confirmOutcome: ConfirmOutcome = options.confirm ?? {
    type: "success",
    data: {
      operationSessionId:
        options.start.type === "success"
          ? options.start.data.operation_session_id
          : "rcbopsess_story",
      changeType:
        options.start.type === "success"
          ? options.start.data.change_type
          : "immediate",
      newProductId:
        options.start.type === "success"
          ? options.start.data.to_product.product_id
          : "premium_monthly",
    },
  };

  const helper = {
    async start(): Promise<SubscriptionChangeCheckoutStartResponse> {
      if (options.start.type === "pending") {
        return new Promise(() => {});
      }
      if (options.start.type === "error") {
        throw new PurchaseFlowError(
          PurchaseFlowErrorCode.ErrorSettingUpPurchase,
          options.start.message,
        );
      }
      return options.start.data;
    },
    async confirm(): Promise<ProductChangeResult> {
      if (confirmOutcome.type === "pending") {
        return new Promise(() => {});
      }
      if (confirmOutcome.type === "error") {
        throw new PurchaseFlowError(
          PurchaseFlowErrorCode.ErrorChargingPayment,
          confirmOutcome.message,
        );
      }
      return confirmOutcome.data;
    },
    getStartResponse(): SubscriptionChangeCheckoutStartResponse | null {
      return options.start.type === "success" ? options.start.data : null;
    },
  };

  return helper as unknown as ProductChangeOperationHelper;
}
