import type { ProductChangeResult } from "../../entities/product-change-params";
import type {
  ProductChangeOperationHelper,
  ProductChangeStartResult,
} from "../../helpers/product-change-operation-helper";
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

/** Storybook stub for {@link ProductChangeOperationHelper}. */
export function createMockProductChangeOperationHelper(options: {
  start: StartOutcome;
  confirm?: ConfirmOutcome;
}): {
  helper: ProductChangeOperationHelper;
  startCheckout: () => Promise<ProductChangeStartResult>;
} {
  let storedStart: SubscriptionChangeCheckoutStartResponse | null =
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

  const startCheckout = (): Promise<ProductChangeStartResult> => {
    if (options.start.type === "pending") {
      return new Promise(() => {});
    }
    if (options.start.type === "error") {
      return Promise.reject(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.ErrorSettingUpPurchase,
          options.start.message,
        ),
      );
    }
    storedStart = options.start.data;
    return Promise.resolve({
      mode: "subscription_change",
      response: options.start.data,
    });
  };

  const helper = {
    async start(): Promise<never> {
      throw new Error(
        "Mock ProductChangeOperationHelper.start() should not be called; the UI uses the startCheckout prop.",
      );
    },
    setStartResponse(response: SubscriptionChangeCheckoutStartResponse): void {
      storedStart = response;
    },
    getStartResponse(): SubscriptionChangeCheckoutStartResponse | null {
      return storedStart;
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

  return {
    helper: helper as unknown as ProductChangeOperationHelper,
    startCheckout,
  };
}
