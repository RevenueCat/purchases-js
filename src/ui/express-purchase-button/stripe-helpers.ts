import {
  ProductType,
  type NonSubscriptionOption,
  type Package,
  type Product,
  type PurchaseOption,
  type SubscriptionOption,
} from "../../entities/offerings";
import type { Translator } from "../localization/translator";
import type { GatewayParams } from "../../networking/responses/stripe-elements";
import { StripeService } from "../../stripe/stripe-service";
import { resolveDiscountBreakdownForPurchaseOption } from "../../helpers/discount-breakdown-helper";
import type { StripeElements } from "@stripe/stripe-js";
import type { StripeElementsConfiguration } from "../../networking/responses/stripe-elements";
import { DEFAULT_FONT_FAMILY } from "../theme/text";
import { getInitialPriceFromPurchaseOption } from "../../helpers/purchase-option-price-helper";
import { type PriceBreakdown } from "../ui-types";
import {
  PurchaseFlowError,
  PurchaseFlowErrorCode,
} from "../../helpers/purchase-operation-helper";
import { getNullableWindow } from "../../helpers/browser-globals";
import type { BrandingInfoResponse } from "../../networking/responses/branding-response";
import type { WalletButtonTheme } from "@revenuecat/purchases-ui-js";

const getCheckoutPurchaseOption = (
  productDetails: Product,
  purchaseOption: PurchaseOption,
): SubscriptionOption | NonSubscriptionOption => {
  if (productDetails.productType === ProductType.Subscription) {
    const subscriptionOption =
      productDetails.subscriptionOptions?.[purchaseOption.id] ||
      productDetails.defaultSubscriptionOption;

    if (!subscriptionOption) {
      throw new PurchaseFlowError(PurchaseFlowErrorCode.ErrorSettingUpPurchase);
    }

    return subscriptionOption;
  }

  const nonSubscriptionOption = productDetails.defaultNonSubscriptionOption;

  if (!nonSubscriptionOption) {
    throw new PurchaseFlowError(PurchaseFlowErrorCode.ErrorSettingUpPurchase);
  }

  return nonSubscriptionOption;
};

const buildExpressCheckoutPriceBreakdown = (
  productDetails: Product,
  purchaseOption: SubscriptionOption | NonSubscriptionOption,
): PriceBreakdown => {
  const initialPrice = getInitialPriceFromPurchaseOption(
    productDetails,
    purchaseOption,
  );

  // Design decision: We will always show the price before taxes in the
  // express checkout modal.
  // We will charge, according to the billing address retrieved by the
  // wallet, if any, but it would be visible only in the invoice.
  // This is the behavior of other IAP stores, and we want to be as close
  // as possible to that in this component.
  return {
    currency: initialPrice.currency,
    taxCalculationStatus: "unavailable",
    totalAmountInMicros: initialPrice.amountMicros,
    totalExcludingTaxInMicros: initialPrice.amountMicros,
    taxAmountInMicros: null,
    taxBreakdown: null,
  };
};

export const toExpressPurchaseOptions = (
  rcPackage: Package,
  purchaseOption: PurchaseOption,
  managementUrl: string,
  translator: Translator,
  appName?: string | null,
  walletButtonTheme?: WalletButtonTheme,
) => {
  const productDetails: Product = rcPackage.webBillingProduct;
  const checkoutPurchaseOption = getCheckoutPurchaseOption(
    productDetails,
    purchaseOption,
  );
  const priceBreakdown = buildExpressCheckoutPriceBreakdown(
    productDetails,
    checkoutPurchaseOption,
  );
  const resolvedDiscount = resolveDiscountBreakdownForPurchaseOption({
    priceBreakdown,
    productDetails,
    purchaseOption: checkoutPurchaseOption,
    translator,
  });

  const isSubscription =
    productDetails.productType === ProductType.Subscription;
  const options = isSubscription
    ? StripeService.buildStripeExpressCheckoutOptionsForSubscription(
        productDetails,
        priceBreakdown,
        checkoutPurchaseOption as SubscriptionOption,
        translator,
        managementUrl,
        resolvedDiscount,
        2,
        1,
      )
    : StripeService.buildStripeExpressCheckoutOptionsForNonSubscription(
        productDetails,
        priceBreakdown,
        resolvedDiscount,
        2,
        1,
      );

  if (walletButtonTheme) {
    options.buttonTheme = {
      applePay: walletButtonTheme,
      // Google Pay only supports "black" | "white"
      googlePay:
        walletButtonTheme === "white-outline" ? "white" : walletButtonTheme,
    };
  }

  if (appName) {
    options.business = { name: appName };
  }

  return options;
};

export const updateStripe = (
  elements: StripeElements,
  gatewayParams: GatewayParams,
  managementUrl: string,
  rcPackage: Package,
  purchaseOption: PurchaseOption,
  translator: Translator,
  brandingInfo: BrandingInfoResponse | null,
  walletButtonTheme?: WalletButtonTheme,
) => {
  if (!gatewayParams.elements_configuration) {
    throw new PurchaseFlowError(PurchaseFlowErrorCode.ErrorSettingUpPurchase);
  }

  StripeService.updateElementsConfiguration(
    elements,
    gatewayParams.elements_configuration,
  );

  const options = toExpressPurchaseOptions(
    rcPackage,
    purchaseOption,
    managementUrl,
    translator,
    brandingInfo?.app_name,
    walletButtonTheme,
  );
  return { expOptions: options };
};

export const initStripe = async (
  gatewayParams: GatewayParams,
  managementUrl: string,
  rcPackage: Package,
  purchaseOption: PurchaseOption,
  translator: Translator,
  brandingInfo: BrandingInfoResponse | null,
  walletButtonTheme?: WalletButtonTheme,
) => {
  if (!gatewayParams.elements_configuration) {
    throw new PurchaseFlowError(PurchaseFlowErrorCode.ErrorSettingUpPurchase);
  }

  // Aiming for a pure function so that it can be extracted
  // Not assigning any state variable in here.
  const stripeAccountId = gatewayParams.stripe_account_id;
  const publishableApiKey = gatewayParams.publishable_api_key;
  const stripeLocale = StripeService.getStripeLocale(
    translator.bcp47Locale || translator.fallbackBcp47Locale,
  );

  const stripeVariables = {
    // Floating labels size cannot be overriden in Stripe since `!important` is being used.
    // There we set fontSizeBase to the desired label size
    // and update the input font size to 16px.
    fontSizeBase: "14px",
    fontFamily: DEFAULT_FONT_FAMILY,
    // Spacing is hardcoded to 16px to match the desired gaps in mobile/desktop
    // which do not match the design system spacing. Also we cannot use "rem" units
    // since the fontSizeBase is set to 14px per the comment above.
    spacingGridRow: "16px",
  };

  const isMobile =
    getNullableWindow()?.matchMedia &&
    getNullableWindow()?.matchMedia("(max-width: 767px)").matches;

  let viewport: "mobile" | "desktop" = "mobile";

  if (isMobile) {
    viewport = "mobile";
  } else {
    viewport = "desktop";
  }

  if (!stripeAccountId || !publishableApiKey) {
    throw new PurchaseFlowError(PurchaseFlowErrorCode.ErrorSettingUpPurchase);
  }

  const elementsConfiguration: StripeElementsConfiguration =
    gatewayParams.elements_configuration;

  const { stripe: stripeInstance, elements: elementsInstance } =
    await StripeService.initializeStripe(
      stripeAccountId,
      publishableApiKey,
      elementsConfiguration,
      brandingInfo,
      stripeLocale,
      stripeVariables,
      viewport,
    );

  const options = toExpressPurchaseOptions(
    rcPackage,
    purchaseOption,
    managementUrl,
    translator,
    brandingInfo?.app_name,
    walletButtonTheme,
  );

  return { stripeInstance, elementsInstance, expOptions: options };
};
