import type {
  PaymentIntentResult,
  PaymentRequestOptions,
  PaymentRequestPaymentMethodEvent,
  SetupIntentResult,
  Stripe,
} from "@stripe/stripe-js";

import type { IEventsTracker } from "../behavioural-events/events-tracker";
import {
  createCheckoutPaymentFormSubmitEvent,
  createCheckoutPaymentGatewayErrorEvent,
  createCheckoutPaymentTaxCalculationEvent,
} from "../behavioural-events/sdk-event-helpers";
import {
  ProductType,
  type Product,
  type PurchaseOption,
  type SubscriptionOption,
} from "../entities/offerings";
import { resolveDiscountBreakdownForPurchaseOption } from "../helpers/discount-breakdown-helper";
import {
  type OperationSessionSuccessfulResult,
  PurchaseFlowError,
  PurchaseFlowErrorCode,
  type PurchaseOperationHelper,
} from "../helpers/purchase-operation-helper";
import { Logger } from "../helpers/logger";
import type { BrandingInfoResponse } from "../networking/responses/branding-response";
import type { StripeBillingApplePayCheckoutStartResponse } from "../networking/responses/checkout-start-response";
import type { Translator } from "../ui/localization/translator";
import type { PriceBreakdown } from "../ui/ui-types";
import { StripeService, StripeServiceError } from "./stripe-service";

export type StripeBillingApplePayAttemptResult =
  | { status: "unavailable" }
  | { status: "cancelled" }
  | {
      status: "finished";
      operationResult: OperationSessionSuccessfulResult;
    };

export interface PreparedStripeBillingApplePayPurchase {
  stripe: Stripe;
  paymentRequest: ReturnType<Stripe["paymentRequest"]>;
  purchaseOperationHelper: PurchaseOperationHelper;
  expiresAt: number;
}

function parseExpirationDate(expiresAt: string): number {
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(expiresAt);
  return Date.parse(hasTimezone ? expiresAt : `${expiresAt}Z`);
}

export async function prepareStripeBillingApplePayPurchase({
  startResponse,
  product,
  purchaseOption,
  brandingInfo,
  translator,
  purchaseOperationHelper,
}: {
  startResponse: StripeBillingApplePayCheckoutStartResponse;
  product: Product;
  purchaseOption: PurchaseOption;
  brandingInfo: BrandingInfoResponse | null;
  translator: Translator;
  purchaseOperationHelper: PurchaseOperationHelper;
}): Promise<PreparedStripeBillingApplePayPurchase | null> {
  try {
    const params = startResponse.stripe_billing_apple_pay_params;
    if (!params?.account_country) {
      Logger.debugLog(
        "Stripe account country is unavailable; quick purchases will use checkout",
      );
      return null;
    }

    const { stripe } = await StripeService.getStripeClient(
      params.stripe_account_id,
      params.publishable_api_key,
    );
    const priceBreakdown: PriceBreakdown = {
      currency: params.currency,
      totalAmountInMicros: params.amount_in_micros,
      totalExcludingTaxInMicros: params.amount_in_micros,
      taxCalculationStatus: brandingInfo?.gateway_tax_collection_enabled
        ? "unavailable"
        : "disabled",
      taxAmountInMicros: null,
      taxBreakdown: null,
    };
    const paymentRequest = stripe.paymentRequest(
      buildPaymentRequestOptions({
        accountCountry: params.account_country,
        managementUrl: startResponse.management_url,
        product,
        purchaseOption,
        priceBreakdown,
        brandingInfo,
        translator,
      }),
    );
    const canMakePayment = await paymentRequest.canMakePayment();
    if (!canMakePayment?.applePay) {
      return null;
    }

    return {
      stripe,
      paymentRequest,
      purchaseOperationHelper,
      expiresAt: parseExpirationDate(params.expires_at),
    };
  } catch (error) {
    Logger.debugLog(`Apple Pay setup failed, using checkout: ${String(error)}`);
    return null;
  }
}

export function presentStripeBillingApplePayPurchase({
  preparedPurchase,
  customerEmail,
  translator,
  eventsTracker,
}: {
  preparedPurchase: PreparedStripeBillingApplePayPurchase;
  customerEmail?: string;
  translator: Translator;
  eventsTracker: IEventsTracker;
}): Promise<StripeBillingApplePayAttemptResult> {
  const { paymentRequest } = preparedPurchase;

  return new Promise((resolve, reject) => {
    let paymentAuthorized = false;
    let settled = false;

    const cleanup = () => {
      paymentRequest.off("cancel", cancelHandler);
      paymentRequest.off("paymentmethod", paymentMethodHandler);
    };
    const cancelHandler = () => {
      if (paymentAuthorized || settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve({ status: "cancelled" });
    };
    const paymentMethodHandler = (event: PaymentRequestPaymentMethodEvent) => {
      if (settled) {
        return;
      }
      paymentAuthorized = true;
      void completeStripeBillingApplePayPurchase({
        preparedPurchase,
        event,
        customerEmail,
        translator,
        eventsTracker,
      })
        .then((operationResult) => {
          if (settled) {
            return;
          }
          settled = true;
          cleanup();
          resolve({ status: "finished", operationResult });
        })
        .catch((error) => {
          if (settled) {
            return;
          }
          settled = true;
          cleanup();
          reject(toPurchaseFlowError(error));
        });
    };

    try {
      paymentRequest.on("cancel", cancelHandler);
      paymentRequest.on("paymentmethod", paymentMethodHandler);
      paymentRequest.show();
    } catch (error) {
      if (paymentAuthorized || settled) {
        return;
      }
      Logger.debugLog(
        `Apple Pay presentation failed, using checkout: ${String(error)}`,
      );
      settled = true;
      cleanup();
      resolve({ status: "unavailable" });
    }
  });
}

function buildPaymentRequestOptions({
  accountCountry,
  managementUrl,
  product,
  purchaseOption,
  priceBreakdown,
  brandingInfo,
  translator,
}: {
  accountCountry: string;
  managementUrl: string;
  product: Product;
  purchaseOption: PurchaseOption;
  priceBreakdown: PriceBreakdown;
  brandingInfo: BrandingInfoResponse | null;
  translator: Translator;
}): PaymentRequestOptions {
  const resolvedDiscount = resolveDiscountBreakdownForPurchaseOption({
    priceBreakdown,
    productDetails: product,
    purchaseOption,
    translator,
  });
  const expressCheckoutOptions =
    product.productType === ProductType.Subscription
      ? StripeService.buildStripeExpressCheckoutOptionsForSubscription(
          product,
          priceBreakdown,
          getSubscriptionOption(product, purchaseOption),
          translator,
          managementUrl,
          resolvedDiscount,
        )
      : StripeService.buildStripeExpressCheckoutOptionsForNonSubscription(
          product,
          priceBreakdown,
          resolvedDiscount,
        );

  return {
    country: accountCountry.toUpperCase(),
    currency: priceBreakdown.currency.toLowerCase(),
    total: {
      label: brandingInfo?.app_name ?? product.title,
      amount: StripeService.microsToMinimumAmountPrice(
        priceBreakdown.totalAmountInMicros,
        priceBreakdown.currency,
      ),
    },
    displayItems: expressCheckoutOptions.lineItems?.map((lineItem) => ({
      label: lineItem.name,
      amount: lineItem.amount,
    })),
    applePay: expressCheckoutOptions.applePay,
    requestPayerName: true,
    requestPayerEmail: true,
    disableWallets: ["googlePay", "link", "browserCard"],
  };
}

function getSubscriptionOption(
  product: Product,
  purchaseOption: PurchaseOption,
): SubscriptionOption {
  const subscriptionOption =
    product.subscriptionOptions?.[purchaseOption.id] ??
    product.defaultSubscriptionOption;
  if (!subscriptionOption) {
    throw new PurchaseFlowError(PurchaseFlowErrorCode.ErrorSettingUpPurchase);
  }
  return subscriptionOption;
}

async function completeStripeBillingApplePayPurchase({
  preparedPurchase,
  event,
  customerEmail,
  translator,
  eventsTracker,
}: {
  preparedPurchase: PreparedStripeBillingApplePayPurchase;
  event: PaymentRequestPaymentMethodEvent;
  customerEmail?: string;
  translator: Translator;
  eventsTracker: IEventsTracker;
}): Promise<OperationSessionSuccessfulResult> {
  const { stripe, purchaseOperationHelper } = preparedPurchase;
  eventsTracker.trackSDKEvent(
    createCheckoutPaymentFormSubmitEvent({
      selectedPaymentMethod: "apple_pay",
    }),
  );

  let paymentRequestCompleted = false;

  try {
    const billingDetails = event.paymentMethod.billing_details;
    const billingAddress = billingDetails.address;
    const customerDetails = {
      countryCode: billingAddress?.country ?? undefined,
      postalCode: billingAddress?.postal_code ?? undefined,
      state: billingAddress?.state ?? undefined,
      city: billingAddress?.city ?? undefined,
      addressLine1: billingAddress?.line1 ?? undefined,
      addressLine2: billingAddress?.line2 ?? undefined,
    };
    const taxCalculation =
      await purchaseOperationHelper.checkoutRefreshPricing(customerDetails);
    eventsTracker.trackSDKEvent(
      createCheckoutPaymentTaxCalculationEvent({
        taxCalculation,
        taxCustomerDetails: customerDetails,
      }),
    );

    const email =
      customerEmail ?? event.payerEmail ?? billingDetails.email ?? undefined;
    const completeResponse = await purchaseOperationHelper.checkoutComplete({
      email,
      locale: translator.selectedLocale,
      billingName: billingDetails.name ?? event.payerName ?? undefined,
      billingAddress: customerDetails.countryCode
        ? { ...customerDetails, countryCode: customerDetails.countryCode }
        : undefined,
    });
    const clientSecret = completeResponse.gateway_params?.client_secret;
    const intentType = completeResponse.gateway_params?.intent_type;
    if (!clientSecret || !intentType) {
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorChargingPayment,
        "The Apple Pay payment could not be initialized.",
      );
    }

    const confirmationResult = await confirmApplePayPayment(
      stripe,
      clientSecret,
      intentType,
      event.paymentMethod.id,
    );
    event.complete("success");
    paymentRequestCompleted = true;
    await handleRequiredAction(stripe, clientSecret, confirmationResult);
    return await purchaseOperationHelper.pollCurrentPurchaseForCompletion();
  } catch (error) {
    if (!paymentRequestCompleted) {
      event.complete("fail");
    }
    if (error instanceof StripeServiceError) {
      eventsTracker.trackSDKEvent(
        createCheckoutPaymentGatewayErrorEvent({
          errorCode: error.gatewayErrorCode ?? null,
          errorMessage: error.message ?? "",
        }),
      );
    }
    throw error;
  }
}

async function confirmApplePayPayment(
  stripe: Stripe,
  clientSecret: string,
  intentType: "payment_intent" | "setup_intent",
  paymentMethodId: string,
): Promise<PaymentIntentResult | SetupIntentResult> {
  const data = { payment_method: paymentMethodId };
  const options = { handleActions: false };
  const result =
    intentType === "setup_intent"
      ? await stripe.confirmCardSetup(clientSecret, data, options)
      : await stripe.confirmCardPayment(clientSecret, data, options);

  if (result.error) {
    throw StripeService.mapError(result.error);
  }
  return result;
}

async function handleRequiredAction(
  stripe: Stripe,
  clientSecret: string,
  result: PaymentIntentResult | SetupIntentResult,
): Promise<void> {
  if (
    "paymentIntent" in result &&
    result.paymentIntent?.status === "requires_action"
  ) {
    const actionResult = await stripe.confirmCardPayment(clientSecret);
    if (actionResult.error) {
      throw StripeService.mapError(actionResult.error);
    }
  }

  if (
    "setupIntent" in result &&
    result.setupIntent?.status === "requires_action"
  ) {
    const actionResult = await stripe.confirmCardSetup(clientSecret);
    if (actionResult.error) {
      throw StripeService.mapError(actionResult.error);
    }
  }
}

function toPurchaseFlowError(error: unknown): PurchaseFlowError {
  if (error instanceof PurchaseFlowError) {
    return error;
  }
  if (error instanceof StripeServiceError) {
    return new PurchaseFlowError(
      PurchaseFlowErrorCode.ErrorChargingPayment,
      "The Apple Pay payment failed.",
      error.message,
    );
  }
  return new PurchaseFlowError(
    PurchaseFlowErrorCode.UnknownError,
    "The Apple Pay payment failed.",
    error instanceof Error ? error.message : String(error),
  );
}
