import type {
  CheckoutOpenOptions,
  DisplayMode,
  Paddle,
  PaddleEventData,
  Theme,
  Variant,
  Version,
} from "@paddle/paddle-js";
import {
  initializePaddle as initPaddle,
  CheckoutEventNames,
} from "@paddle/paddle-js";
import { Logger } from "../helpers/logger";
import { ErrorCode, PurchasesError } from "../entities/errors";
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
import type { AttributionMetadata } from "../entities/purchase-params";
import type { CheckoutStatusResponse } from "../networking/responses/checkout-status-response";
import { CheckoutSessionStatus } from "../networking/responses/checkout-status-response";
import { toRedemptionInfo } from "../entities/redemption-info";
import type { OperationSessionSuccessfulResult } from "../helpers/purchase-operation-helper";
import { handleCheckoutSessionFailed } from "../helpers/checkout-error-handler";
import type { PaddleCheckoutStartResponse } from "../networking/responses/checkout-start-response";
import type { IEventsTracker } from "../behavioural-events/events-tracker";

interface PaddlePurchaseParams {
  rcPackage: Package;
  purchaseOption: PurchaseOption;
  appUserId: string;
  presentedOfferingIdentifier: string;
  customerEmail?: string;
  locale?: string;
}

/**
 * How Paddle's checkout is presented:
 * - "overlay": Paddle renders its own full-screen modal popup (current default).
 * - "inline": Paddle injects its checkout iframe into a container element we
 *   provide (see {@link PADDLE_INLINE_FRAME_TARGET}), rendered within our own UI.
 */
export type PaddleCheckoutDisplayMode = "overlay" | "inline";

/**
 * Order totals surfaced by Paddle's checkout events (`checkout.loaded` /
 * `checkout.updated`). Amounts are in major currency units (e.g. 9.99). Lets
 * the inline UI render the same Subtotal/Tax/Total breakdown Paddle's overlay
 * shows, and keep it updated live as the customer enters their address.
 */
export interface PaddleCheckoutTotals {
  currencyCode: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  /** Recurring total (incl. tax) for the next billing period, if subscription. */
  recurringTotalAmount: number | null;
  /** Product name from Paddle's first checkout item (e.g. "Premium"). */
  productName: string | null;
  /** Price name from Paddle's first checkout item (e.g. "monthly"). */
  priceName: string | null;
}

/**
 * Class name of the container element Paddle injects its inline checkout iframe
 * into. The element must already exist in the DOM when `Checkout.open()` is
 * called. Only relevant when displayMode is "inline".
 */
export const PADDLE_INLINE_FRAME_TARGET = "paddle-checkout-container";

const PADDLE_INLINE_FRAME_INITIAL_HEIGHT = 450;
const PADDLE_INLINE_FRAME_STYLE =
  "width:100%; min-width:312px; background-color:transparent; border:none;";

interface BuildPaddleCheckoutOptionsParams {
  transactionId: string;
  locale: string;
  customerEmail?: string;
  displayMode?: PaddleCheckoutDisplayMode;
}

/**
 * Builds the options passed to `Paddle.Checkout.open()`. Defaults to the
 * overlay presentation so existing behavior is unchanged; passing
 * `displayMode: "inline"` additionally sets the frame target/height/style
 * required to embed Paddle's checkout inside our own container.
 */
export function buildPaddleCheckoutOptions({
  transactionId,
  locale,
  customerEmail,
  displayMode = "overlay",
}: BuildPaddleCheckoutOptionsParams): CheckoutOpenOptions {
  const commonSettings = {
    theme: "light" as Theme,
    variant: "one-page" as Variant,
    locale,
    allowLogout: false,
    showAddDiscounts: false,
    showAddTaxId: false,
    allowDiscountRemoval: false,
  };

  const settings =
    displayMode === "inline"
      ? {
          ...commonSettings,
          displayMode: "inline" as DisplayMode,
          frameTarget: PADDLE_INLINE_FRAME_TARGET,
          frameInitialHeight: PADDLE_INLINE_FRAME_INITIAL_HEIGHT,
          frameStyle: PADDLE_INLINE_FRAME_STYLE,
        }
      : {
          ...commonSettings,
          displayMode: "overlay" as DisplayMode,
        };

  return {
    transactionId,
    settings,
    ...(customerEmail && { customer: { email: customerEmail } }),
  };
}

interface PaddlePurchase {
  operationSessionId: string;
  transactionId: string;
  onCheckoutLoaded: () => void;
  params: PaddlePurchaseParams;
  onClose: () => void;
  displayMode?: PaddleCheckoutDisplayMode;
  /**
   * Invoked with the order totals whenever Paddle reports them
   * (`checkout.loaded` and `checkout.updated`). Used by the inline UI to render
   * the Subtotal/Tax/Total breakdown.
   */
  onCheckoutTotals?: (totals: PaddleCheckoutTotals) => void;
}

interface PaddleStartCheckoutParams {
  appUserId: string;
  productId: string;
  presentedOfferingContext: PresentedOfferingContext;
  purchaseOption: PurchaseOption;
  customerEmail?: string;
  metadata?: PurchaseMetadata;
  locale?: string;
  attributionMetadata?: AttributionMetadata;
}

export class PaddleService {
  private paddleInstance: Paddle | undefined;
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

  async initializePaddle(token: string, isSandbox: boolean): Promise<Paddle> {
    if (this.paddleInstance?.Initialized) {
      Logger.debugLog(
        "Paddle already initialized, returning existing instance",
      );
      return this.paddleInstance;
    }

    const environment = isSandbox ? "sandbox" : "production";
    try {
      const paddleInstance = await initPaddle({
        token: token,
        version: "v1" as Version,
        environment: environment,
      });
      if (!paddleInstance) {
        throw new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "Paddle client not found",
        );
      }
      this.paddleInstance = paddleInstance;
      Logger.debugLog(`Paddle initialized with environment: ${environment}`);
      return paddleInstance;
    } catch (error) {
      if (error instanceof PurchaseFlowError) {
        throw error;
      }
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.UnknownError,
        `Error initializing Paddle: ${error}`,
      );
    }
  }

  getPaddleInstance(): Paddle {
    if (!this.paddleInstance?.Initialized) {
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.UnknownError,
        "Paddle not initialized.",
      );
    }
    return this.paddleInstance;
  }

  /**
   * Closes Paddle's checkout via `Paddle.Checkout.close()`. For the inline
   * presentation this removes the embedded iframe from the DOM so we can return
   * the user to the previous step (see Paddle's branded inline checkout docs).
   * Safe no-op if Paddle isn't initialized.
   */
  closeCheckout(): void {
    if (this.paddleInstance?.Initialized) {
      this.paddleInstance.Checkout.close();
    }
  }

  async startCheckout({
    appUserId,
    productId,
    presentedOfferingContext,
    purchaseOption,
    customerEmail,
    metadata,
    locale,
    attributionMetadata,
  }: PaddleStartCheckoutParams): Promise<PaddleCheckoutStartResponse> {
    try {
      const traceId = this.eventsTracker.getTraceId();
      const startResponse =
        await this.backend.postCheckoutStart<PaddleCheckoutStartResponse>({
          appUserId,
          productId,
          purchaseOption,
          presentedOfferingContext,
          traceId,
          customerEmail: customerEmail ?? undefined,
          metadata,
          locale,
          attributionMetadata,
        });

      await this.initializePaddle(
        startResponse.paddle_billing_params.client_side_token,
        startResponse.paddle_billing_params.is_sandbox,
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
          `Error starting Paddle checkout: ${error}`,
        );
      }
    }
  }

  async purchase({
    operationSessionId,
    transactionId,
    onCheckoutLoaded,
    onClose,
    params,
    displayMode = "overlay",
    onCheckoutTotals,
  }: PaddlePurchase): Promise<OperationSessionSuccessfulResult> {
    const paddleInstance = this.getPaddleInstance();
    const { customerEmail, locale = "en" } = params;

    const forwardTotals = (data: PaddleEventData["data"]) => {
      if (onCheckoutTotals && data?.totals) {
        const item = data.items?.[0];
        onCheckoutTotals({
          currencyCode: data.currency_code,
          subtotalAmount: data.totals.subtotal,
          taxAmount: data.totals.tax,
          totalAmount: data.totals.total,
          recurringTotalAmount: data.recurring_totals?.total ?? null,
          productName: item?.product?.name ?? null,
          priceName: item?.price_name ?? null,
        });
      }
    };

    return new Promise<OperationSessionSuccessfulResult>((resolve, reject) => {
      paddleInstance.Update({
        eventCallback: async (paddleEventData: PaddleEventData) => {
          const eventName = paddleEventData.name;
          const data = paddleEventData.data;

          try {
            if (eventName === CheckoutEventNames.CHECKOUT_LOADED) {
              onCheckoutLoaded();
              forwardTotals(data);
            } else if (eventName === CheckoutEventNames.CHECKOUT_UPDATED) {
              // Totals change as the customer enters their address (tax) etc.
              forwardTotals(data);
            } else if (eventName === CheckoutEventNames.CHECKOUT_COMPLETED) {
              // Close Paddle's success page to show the PaddlePurchaseUi status page
              paddleInstance.Checkout.close();
              const checkoutStatus =
                await this.pollOperationStatus(operationSessionId);

              resolve(checkoutStatus);
            } else if (eventName === CheckoutEventNames.CHECKOUT_CLOSED) {
              // Only unmount PaddlePurchaseUi if the user closes Paddle's checkout modal
              // not when this code calls paddleInstance.Checkout.close()
              const paddleInitiatedCheckoutClosedEvent = !!data?.status;
              if (paddleInitiatedCheckoutClosedEvent) {
                onClose();
              }
            }
          } catch (error) {
            paddleInstance.Checkout.close();

            if (error instanceof PurchaseFlowError) {
              reject(error);
            } else if (error instanceof PurchasesError) {
              reject(
                PurchaseFlowError.fromPurchasesError(
                  error,
                  PurchaseFlowErrorCode.UnknownError,
                ),
              );
            } else {
              reject(
                new PurchaseFlowError(
                  PurchaseFlowErrorCode.UnknownError,
                  `Paddle event handler error: ${error}`,
                ),
              );
            }
          }
        },
      });

      const checkoutData = buildPaddleCheckoutOptions({
        transactionId,
        locale,
        customerEmail,
        displayMode,
      });

      try {
        paddleInstance.Checkout.open(checkoutData);
      } catch (error) {
        reject(
          new PurchaseFlowError(
            PurchaseFlowErrorCode.UnknownError,
            `Failed to open Paddle checkout: ${error}`,
          ),
        );
      }
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
                  attributionMetadata:
                    operationResponse.attribution_metadata ?? undefined,
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
