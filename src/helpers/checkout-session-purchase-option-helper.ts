import type { Product, PurchaseOption } from "../entities/offerings";
import { toPurchaseOptionForProductType } from "../entities/offerings";
import type { CheckoutPricingResponse } from "../networking/responses/checkout-pricing-response";

export function getActiveCheckoutPurchaseOption(
  productDetails: Product,
  fallbackPurchaseOption: PurchaseOption,
  checkoutPricingResponse?: CheckoutPricingResponse | null,
): PurchaseOption {
  const selectedPurchaseOption =
    checkoutPricingResponse?.selected_purchase_option;

  if (!selectedPurchaseOption) {
    return fallbackPurchaseOption;
  }

  return (
    toPurchaseOptionForProductType(
      productDetails.productType,
      selectedPurchaseOption,
    ) ?? fallbackPurchaseOption
  );
}
