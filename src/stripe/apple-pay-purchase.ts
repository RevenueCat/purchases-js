import type {
  PaymentIntentResult,
  PaymentRequestOptions,
  PaymentRequestPaymentMethodEvent,
  PaymentRequestUpdateOptions,
  SetupIntentResult,
  Stripe,
} from "@stripe/stripe-js";

import type { IEventsTracker } from "../behavioural-events/events-tracker";
import {
  createCheckoutPaymentGatewayErrorEvent,
  createCheckoutPaymentFormSubmitEvent,
  createCheckoutPaymentTaxCalculationEvent,
} from "../behavioural-events/sdk-event-helpers";
import {
  ProductType,
  type Product,
  type PurchaseOption,
  type SubscriptionOption,
} from "../entities/offerings";
import {
  PurchaseFlowError,
  PurchaseFlowErrorCode,
  type OperationSessionSuccessfulResult,
  type PurchaseOperationHelper,
} from "../helpers/purchase-operation-helper";
import { resolveDiscountBreakdownForPurchaseOption } from "../helpers/discount-breakdown-helper";
import { Logger } from "../helpers/logger";
import type { BrandingInfoResponse } from "../networking/responses/branding-response";
import type { GatewayParams } from "../networking/responses/stripe-elements";
import type { Translator } from "../ui/localization/translator";
import type { PriceBreakdown } from "../ui/ui-types";
import { StripeService, StripeServiceError } from "./stripe-service";

export type ApplePayPurchaseAttemptResult =
  | { status: "unavailable" }
  | { status: "cancelled" }
  | {
      status: "finished";
      operationResult: OperationSessionSuccessfulResult;
    };

interface TryApplePayPurchaseParams {
  gatewayParams: GatewayParams;
  managementUrl: string;
  product: Product;
  purchaseOption: PurchaseOption;
  priceBreakdown: PriceBreakdown;
  brandingInfo: BrandingInfoResponse | null;
  translator: Translator;
  customerEmail?: string;
  purchaseOperationHelper: PurchaseOperationHelper;
  eventsTracker: IEventsTracker;
}

export interface PreparedApplePayPurchase {
  stripe: Stripe;
  paymentRequest: ReturnType<Stripe["paymentRequest"]>;
  managementUrl: string;
}

export interface PreparedApplePayConfiguration {
  stripe: Stripe;
  accountCountry: string;
  managementUrl: string;
}

type PrepareApplePayPurchaseParams = Omit<
  TryApplePayPurchaseParams,
  "customerEmail" | "purchaseOperationHelper" | "eventsTracker"
>;

type CompletePaymentRequestUpdateOptions = PaymentRequestUpdateOptions & {
  currency: string;
  total: NonNullable<PaymentRequestUpdateOptions["total"]>;
};

export async function tryApplePayPurchase({
  gatewayParams,
  managementUrl,
  product,
  purchaseOption,
  priceBreakdown,
  brandingInfo,
  translator,
  customerEmail,
  purchaseOperationHelper,
  eventsTracker,
}: TryApplePayPurchaseParams): Promise<ApplePayPurchaseAttemptResult> {
  const preparedPurchase = await prepareApplePayPurchase({
    gatewayParams,
    managementUrl,
    product,
    purchaseOption,
    priceBreakdown,
    brandingInfo,
    translator,
  });

  if (!preparedPurchase) {
    return { status: "unavailable" };
  }

  return await presentPreparedApplePayPurchase({
    preparedPurchase,
    customerEmail,
    brandingInfo,
    translator,
    purchaseOperationHelper,
    eventsTracker,
  });
}

export async function prepareApplePayPurchase({
  gatewayParams,
  managementUrl,
  product,
  purchaseOption,
  priceBreakdown,
  brandingInfo,
  translator,
}: PrepareApplePayPurchaseParams): Promise<PreparedApplePayPurchase | null> {
  try {
    const configuration = await prepareApplePayConfiguration({
      gatewayParams,
      managementUrl,
    });
    const preparedPurchase = createPreparedApplePayPurchase({
      configuration,
      product,
      purchaseOption,
      priceBreakdown,
      brandingInfo,
      translator,
    });

    const canMakePayment =
      await preparedPurchase.paymentRequest.canMakePayment();
    if (!canMakePayment?.applePay) {
      return null;
    }

    return preparedPurchase;
  } catch (error) {
    Logger.debugLog(`Apple Pay setup failed, using checkout: ${String(error)}`);
    return null;
  }
}

export async function prepareApplePayConfiguration({
  gatewayParams,
  managementUrl,
}: {
  gatewayParams: GatewayParams;
  managementUrl: string;
}): Promise<PreparedApplePayConfiguration> {
  const stripeAccountId = gatewayParams.stripe_account_id;
  const publishableApiKey = gatewayParams.publishable_api_key;
  const accountCountry = gatewayParams.account_country;
  if (!stripeAccountId || !publishableApiKey || !accountCountry) {
    throw new PurchaseFlowError(
      PurchaseFlowErrorCode.ErrorSettingUpPurchase,
      "Apple Pay configuration is incomplete.",
    );
  }

  const { stripe } = await StripeService.getStripeClient(
    stripeAccountId,
    publishableApiKey,
  );
  return { stripe, accountCountry, managementUrl };
}

export async function prepareApplePayPurchaseForLater(
  configuration: PreparedApplePayConfiguration,
): Promise<PreparedApplePayPurchase | null> {
  const { stripe, accountCountry, managementUrl } = configuration;
  // Stripe requires canMakePayment() to run on the same request that is shown.
  // The real purchase details replace these placeholders synchronously on click.
  const paymentRequest = stripe.paymentRequest({
    country: accountCountry.toUpperCase(),
    currency: "usd",
    total: {
      label: "RevenueCat",
      amount: 1,
    },
    requestPayerName: true,
    requestPayerEmail: true,
    disableWallets: ["googlePay", "link", "browserCard"],
  });
  const canMakePayment = await paymentRequest.canMakePayment();
  if (!canMakePayment?.applePay) {
    return null;
  }

  return { stripe, paymentRequest, managementUrl };
}

export function createPreparedApplePayPurchase({
  configuration,
  product,
  purchaseOption,
  priceBreakdown,
  brandingInfo,
  translator,
}: {
  configuration: PreparedApplePayConfiguration;
  product: Product;
  purchaseOption: PurchaseOption;
  priceBreakdown: PriceBreakdown;
  brandingInfo: BrandingInfoResponse | null;
  translator: Translator;
}): PreparedApplePayPurchase {
  const { stripe, accountCountry, managementUrl } = configuration;
  const paymentRequest = stripe.paymentRequest(
    buildPaymentRequestOptions({
      accountCountry,
      managementUrl,
      product,
      purchaseOption,
      priceBreakdown,
      brandingInfo,
      translator,
    }),
  );
  return { stripe, paymentRequest, managementUrl };
}

export function updatePreparedApplePayPurchase({
  preparedPurchase,
  product,
  purchaseOption,
  priceBreakdown,
  brandingInfo,
  translator,
}: {
  preparedPurchase: PreparedApplePayPurchase;
  product: Product;
  purchaseOption: PurchaseOption;
  priceBreakdown: PriceBreakdown;
  brandingInfo: BrandingInfoResponse | null;
  translator: Translator;
}): PreparedApplePayPurchase {
  preparedPurchase.paymentRequest.update(
    buildPaymentRequestUpdateOptions({
      managementUrl: preparedPurchase.managementUrl,
      product,
      purchaseOption,
      priceBreakdown,
      brandingInfo,
      translator,
    }),
  );
  return preparedPurchase;
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
  return {
    country: accountCountry.toUpperCase(),
    requestPayerName: true,
    requestPayerEmail: true,
    disableWallets: ["googlePay", "link", "browserCard"],
    ...buildPaymentRequestUpdateOptions({
      managementUrl,
      product,
      purchaseOption,
      priceBreakdown,
      brandingInfo,
      translator,
    }),
  };
}

function buildPaymentRequestUpdateOptions({
  managementUrl,
  product,
  purchaseOption,
  priceBreakdown,
  brandingInfo,
  translator,
}: Omit<
  Parameters<typeof buildPaymentRequestOptions>[0],
  "accountCountry"
>): CompletePaymentRequestUpdateOptions {
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

export function presentPreparedApplePayPurchase({
  preparedPurchase,
  customerEmail,
  brandingInfo,
  translator,
  purchaseOperationHelper,
  eventsTracker,
  onPresented,
}: {
  preparedPurchase: PreparedApplePayPurchase;
  customerEmail?: string;
  brandingInfo: BrandingInfoResponse | null;
  translator: Translator;
  purchaseOperationHelper: PurchaseOperationHelper;
  eventsTracker: IEventsTracker;
  onPresented?: () => Promise<void>;
}): Promise<ApplePayPurchaseAttemptResult> {
  const { stripe, paymentRequest } = preparedPurchase;

  return new Promise((resolve, reject) => {
    let paymentAuthorized = false;
    let settled = false;
    let checkoutReadyPromise: Promise<void> = Promise.resolve();

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
      void checkoutReadyPromise
        .then(() =>
          completeApplePayPurchase({
            stripe,
            event,
            customerEmail,
            brandingInfo,
            translator,
            purchaseOperationHelper,
            eventsTracker,
          }),
        )
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

    paymentRequest.on("cancel", cancelHandler);
    paymentRequest.on("paymentmethod", paymentMethodHandler);

    try {
      paymentRequest.show();
    } catch (error) {
      Logger.debugLog(
        `Apple Pay presentation failed, using checkout: ${String(error)}`,
      );
      settled = true;
      cleanup();
      resolve({ status: "unavailable" });
      return;
    }

    if (onPresented) {
      checkoutReadyPromise = onPresented();
      void checkoutReadyPromise.catch((error) => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        try {
          paymentRequest.abort();
        } catch {
          // The payment sheet can already be closing when checkout start fails.
        }
        reject(toPurchaseFlowError(error));
      });
    }
  });
}

async function completeApplePayPurchase({
  stripe,
  event,
  customerEmail,
  brandingInfo,
  translator,
  purchaseOperationHelper,
  eventsTracker,
}: {
  stripe: Stripe;
  event: PaymentRequestPaymentMethodEvent;
  customerEmail?: string;
  brandingInfo: BrandingInfoResponse | null;
  translator: Translator;
  purchaseOperationHelper: PurchaseOperationHelper;
  eventsTracker: IEventsTracker;
}): Promise<OperationSessionSuccessfulResult> {
  eventsTracker.trackSDKEvent(
    createCheckoutPaymentFormSubmitEvent({
      selectedPaymentMethod: "apple_pay",
    }),
  );

  let paymentRequestCompleted = false;

  try {
    const email =
      customerEmail ??
      event.payerEmail ??
      event.paymentMethod.billing_details.email ??
      undefined;
    const completeResponse = await purchaseOperationHelper.checkoutComplete({
      email,
      locale: translator.selectedLocale,
    });
    const clientSecret = completeResponse.gateway_params?.client_secret;
    if (!clientSecret) {
      throw new PurchaseFlowError(
        PurchaseFlowErrorCode.ErrorChargingPayment,
        "The payment could not be initialized.",
      );
    }

    if (brandingInfo?.gateway_tax_collection_enabled) {
      const billingAddress = event.paymentMethod.billing_details.address;
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
    }

    const result = await confirmApplePayPayment(
      stripe,
      clientSecret,
      event.paymentMethod.id,
    );
    event.complete("success");
    paymentRequestCompleted = true;
    await handleRequiredAction(stripe, clientSecret, result);
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
  paymentMethodId: string,
): Promise<PaymentIntentResult | SetupIntentResult> {
  const data = { payment_method: paymentMethodId };
  const options = { handleActions: false };
  const result = clientSecret.startsWith("seti_")
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
