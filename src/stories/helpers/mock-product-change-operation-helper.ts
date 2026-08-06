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
 *
 * - success: {@link getStartResponse} returns data (or pass `initialStartData`)
 * - pending: {@link getStartResponse} returns null → UI stays on loading
 * - error: {@link getStartResponse} throws → UI shows load error
 */
export function createMockProductChangeOperationHelper(options: {
  start: StartOutcome;
  confirm?: ConfirmOutcome;
}): ProductChangeOperationHelper {
  let adoptedStart: SubscriptionChangeCheckoutStartResponse | null =
    options.start.type === "success" ? options.start.data : null;

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
    async start(): Promise<never> {
      throw new Error(
        "Mock ProductChangeOperationHelper.start() should not be called; start runs in main.ts before the UI mounts.",
      );
    },
    setStartResponse(response: SubscriptionChangeCheckoutStartResponse): void {
      adoptedStart = response;
    },
    getStartResponse(): SubscriptionChangeCheckoutStartResponse | null {
      if (options.start.type === "error") {
        throw new PurchaseFlowError(
          PurchaseFlowErrorCode.ErrorSettingUpPurchase,
          options.start.message,
        );
      }
      return adoptedStart;
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
  };

  return helper as unknown as ProductChangeOperationHelper;
}
