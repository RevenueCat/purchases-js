import type {
  Package,
  Product,
  PurchaseOption,
  SubscriptionOption,
} from "../../entities/offerings";
import type { Translator } from "../localization/translator";
import { StripeService } from "../../stripe/stripe-service";
import { getInitialPriceFromPurchaseOption } from "../../helpers/purchase-option-price-helper";
import { type PriceBreakdown } from "../ui-types";
import {
  PurchaseFlowError,
  PurchaseFlowErrorCode,
} from "../../helpers/purchase-operation-helper";

const getSubscriptionOptionForExpressCheckout = (
  productDetails: Product,
  purchaseOptionId: string,
): SubscriptionOption => {
  const subscriptionOption =
    productDetails.subscriptionOptions?.[purchaseOptionId] ||
    productDetails.defaultSubscriptionOption;

  if (!subscriptionOption) {
    throw new PurchaseFlowError(PurchaseFlowErrorCode.ErrorSettingUpPurchase);
  }

  return subscriptionOption;
};

const buildExpressCheckoutPriceBreakdown = (
  productDetails: Product,
  subscriptionOption: SubscriptionOption,
): PriceBreakdown => {
  const initialPrice = getInitialPriceFromPurchaseOption(
    productDetails,
    subscriptionOption,
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

const resolveExpressCheckoutPricingDetails = (
  productDetails: Product,
  purchaseOptionId: string,
) => {
  const subscriptionOption = getSubscriptionOptionForExpressCheckout(
    productDetails,
    purchaseOptionId,
  );
  const priceBreakdown = buildExpressCheckoutPriceBreakdown(
    productDetails,
    subscriptionOption,
  );
  return { subscriptionOption, priceBreakdown };
};

export const toExpressPurchaseOptions = (
  rcPackage: Package,
  purchaseOption: PurchaseOption,
  managementUrl: string,
  translator: Translator,
) => {
  const productDetails: Product = rcPackage.webBillingProduct;
  const { subscriptionOption, priceBreakdown } =
    resolveExpressCheckoutPricingDetails(productDetails, purchaseOption.id);

  return StripeService.buildStripeExpressCheckoutOptionsForSubscription(
    productDetails,
    priceBreakdown,
    subscriptionOption,
    translator,
    managementUrl,
    2,
    1,
  );
};
