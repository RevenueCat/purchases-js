import type {
  NonSubscriptionOption,
  Product,
  PurchaseOption,
  SubscriptionOption,
  Price,
} from "../entities/offerings";

/**
 * Gets the initial price from a purchase option, considering intro pricing for subscriptions.
 *
 * For subscription products:
 * - Returns the discount price if available
 * - Falls back to the intro price if available
 * - Falls back to the base price if neither are available
 *
 * For non-subscription products:
 * - Returns the discount price if available
 * - Falls back to the base price if no discount price is available
 *
 * @param productDetails - The product details
 * @param purchaseOption - The purchase option to get the price from
 * @returns The price to use for the initial price breakdown
 * @internal
 */
export function getInitialPriceFromPurchaseOption(
  productDetails: Product,
  purchaseOption: PurchaseOption,
): Price {
  const isSubscription = productDetails.productType === "subscription";

  if (isSubscription) {
    const subscriptionOptionToUse = purchaseOption as SubscriptionOption;

    const initialPrice =
      subscriptionOptionToUse.discountPrice?.price ??
      subscriptionOptionToUse.introPrice?.price ??
      subscriptionOptionToUse.base.price;

    if (initialPrice) {
      return initialPrice;
    }
  } else {
    const nonSubscriptionOptionToUse = purchaseOption as NonSubscriptionOption;
    return (
      nonSubscriptionOptionToUse.discountPrice?.price ??
      nonSubscriptionOptionToUse.basePrice
    );
  }

  // Fallback to price if we can't find the specific option
  return productDetails.price;
}
