import type { PurchaseParams } from "../entities/purchase-params";
import type { PurchaseResult } from "../entities/purchase-result";
import { PurchasesError, ErrorCode } from "../entities/errors";
import { mount, unmount } from "svelte";
import TestStoreModal from "../ui/molecules/test-store-modal.svelte";

export function purchaseTestStoreProduct(
  purchaseParams: PurchaseParams,
): Promise<PurchaseResult> {
  const product = purchaseParams.rcPackage.webBillingProduct;
  const productType = product.productType;
  const freeTrialPhase = product.defaultSubscriptionOption?.trial;
  const introPricePhase = product.defaultSubscriptionOption?.introPrice;
  const basePrice = product.currentPrice;

  const formatPeriod = (
    period: { number: number; unit: string } | null,
  ): string => {
    if (!period) return "N/A";
    return `${period.number} ${period.unit}${period.number > 1 ? "s" : ""}`;
  };

  return new Promise((_resolve, reject) => {
    // Create a container for the modal
    const container = document.createElement("div");
    document.body.appendChild(container);

    const cleanup = () => {
      if (component) {
        unmount(component);
      }
      document.body.removeChild(container);
    };

    let component: ReturnType<typeof mount> | null = null;

    component = mount(TestStoreModal, {
      target: container,
      props: {
        productIdentifier: product.identifier,
        productType: productType,
        basePrice: basePrice.formattedPrice,
        freeTrialPeriod: freeTrialPhase
          ? formatPeriod(freeTrialPhase.period)
          : undefined,
        introPriceFormatted: introPricePhase?.price?.formattedPrice,
        onValidPurchase: () => {
          cleanup();
          // TODO: Implement valid purchase logic
          reject(
            new PurchasesError(
              ErrorCode.UnknownError,
              "TODO: Implement valid purchase logic",
            ),
          );
        },
        onFailedPurchase: () => {
          cleanup();
          reject(
            new PurchasesError(
              ErrorCode.ProductNotAvailableForPurchaseError,
              "Simulated test purchase failure: no real transaction occurred",
            ),
          );
        },
        onCancel: () => {
          cleanup();
          reject(new PurchasesError(ErrorCode.UserCancelledError));
        },
      },
    });
  });
}
