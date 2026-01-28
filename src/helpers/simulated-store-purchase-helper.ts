import type { PurchaseParams } from "../entities/purchase-params";
import type { PurchaseResult } from "../entities/purchase-result";
import { ErrorCode, ErrorCodeUtils, PurchasesError } from "../entities/errors";
import { mount, unmount } from "svelte";
import SimulatedStoreModal from "../ui/molecules/simulated-store-modal.svelte";
import type { Backend } from "../networking/backend";
import { postSimulatedStoreReceipt } from "./simulated-store-post-receipt-helper";
import { Logger } from "./logger";
import { getDocument } from "./browser-globals";

export function purchaseSimulatedStoreProduct(
  purchaseParams: PurchaseParams,
  backend: Backend,
  appUserId: string,
): Promise<PurchaseResult> {
  const product = purchaseParams.rcPackage.webBillingProduct;
  const productType = product.productType;
  const freeTrialPhase = product.freeTrialPhase;
  const introPricePhase = product.introPricePhase;
  const basePrice = product.price;

  const formatPeriod = (
    period: { number: number; unit: string } | null,
  ): string => {
    if (!period) return "N/A";
    return `${period.number} ${period.unit}${period.number > 1 ? "s" : ""}`;
  };

  return new Promise((resolve, reject) => {
    // Create a container for the modal
    const doc = getDocument();
    const container = doc.createElement("div");
    doc.body.appendChild(container);

    const cleanup = () => {
      if (component) {
        unmount(component);
      }
      doc.body.removeChild(container);
    };

    let component: ReturnType<typeof mount> | null = null;

    component = mount(SimulatedStoreModal, {
      target: container,
      props: {
        productIdentifier: product.identifier,
        productType: productType,
        basePrice: basePrice.formattedPrice,
        freeTrialPeriod: freeTrialPhase
          ? formatPeriod(freeTrialPhase.period)
          : undefined,
        introPriceFormatted: introPricePhase?.price?.formattedPrice,
        onValidPurchase: async () => {
          cleanup();
          Logger.debugLog(
            "[Test store] Performing test purchase. This purchase won't appear in production.",
          );
          try {
            resolve(
              await postSimulatedStoreReceipt(product, backend, appUserId),
            );
          } catch (error) {
            reject(error);
          }
        },
        onFailedPurchase: () => {
          cleanup();
          Logger.debugLog(
            "[Test store] Purchase failure simulated successfully in Test Store.",
          );
          reject(
            new PurchasesError(
              ErrorCode.TestStoreSimulatedPurchaseError,
              ErrorCodeUtils.getPublicMessage(
                ErrorCode.TestStoreSimulatedPurchaseError,
              ),
              "Simulated error successfully.",
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
