import type { PurchaseParams } from "./entities/purchase-params";
import type { PurchaseResult } from "./entities/purchase-result";
import { PurchasesError, ErrorCode } from "./entities/errors";

export function purchaseTestStoreProduct(
  purchaseParams: PurchaseParams,
): Promise<PurchaseResult> {
  const product = purchaseParams.rcPackage.webBillingProduct;
  const productType = product.productType;
  const freeTrialPhase = product.defaultSubscriptionOption?.trial;
  const introPricePhase = product.defaultSubscriptionOption?.introPrice;
  const basePrice = product.currentPrice;

  return new Promise((_resolve, reject) => {
    // Create modal overlay
    const overlay = document.createElement("div");
    overlay.className = "rc-test-store-modal-overlay";

    // Create modal container
    const modal = document.createElement("div");
    modal.className = "rc-test-store-modal";

    // Create modal content
    const content = document.createElement("div");
    content.className = "rc-test-store-modal-content";

    // Product title
    const title = document.createElement("h2");
    title.textContent = "Test Store Purchase";
    title.className = "rc-test-store-modal-title";

    // Product details
    const details = document.createElement("div");
    details.className = "rc-test-store-modal-details";

    const formatPeriod = (
      period: { number: number; unit: string } | null,
    ): string => {
      if (!period) return "N/A";
      return `${period.number} ${period.unit}${period.number > 1 ? "s" : ""}`;
    };

    const productInfo = document.createElement("div");
    productInfo.innerHTML = `
      <p><strong>Product:</strong> ${product.identifier}</p>
      <p><strong>Type:</strong> ${productType}</p>
      <p><strong>Price:</strong> ${basePrice.formattedPrice}</p>
      ${freeTrialPhase ? `<p><strong>Free Trial:</strong> ${formatPeriod(freeTrialPhase.period)}</p>` : ""}
      ${introPricePhase?.price ? `<p><strong>Intro Price:</strong> ${introPricePhase.price.formattedPrice}</p>` : ""}
    `;

    // Buttons container
    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "rc-test-store-modal-buttons";

    // Test valid purchase button
    const validButton = document.createElement("button");
    validButton.textContent = "Test valid purchase";
    validButton.className =
      "rc-test-store-modal-button rc-test-store-modal-button-primary";
    validButton.onclick = () => {
      cleanup();
      // TODO: Implement valid purchase logic
      reject(
        new PurchasesError(
          ErrorCode.UnknownError,
          "TODO: Implement valid purchase logic",
        ),
      );
    };

    // Test failed purchase button
    const failedButton = document.createElement("button");
    failedButton.textContent = "Test failed purchase";
    failedButton.className =
      "rc-test-store-modal-button rc-test-store-modal-button-secondary";
    failedButton.onclick = () => {
      cleanup();
      reject(
        new PurchasesError(
          ErrorCode.ProductNotAvailableForPurchaseError,
          "Simulated test purchase failure: no real transaction occurred",
        ),
      );
    };

    // Cancel button
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.className =
      "rc-test-store-modal-button rc-test-store-modal-button-cancel";
    cancelButton.onclick = () => {
      cleanup();
      reject(new PurchasesError(ErrorCode.UserCancelledError));
    };

    // Function to clean up modal
    const cleanup = () => {
      document.body.removeChild(overlay);
    };

    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        cleanup();
        reject(new PurchasesError(ErrorCode.UserCancelledError));
      }
    };

    // Assemble the modal
    details.appendChild(productInfo);
    buttonsContainer.appendChild(validButton);
    buttonsContainer.appendChild(failedButton);
    buttonsContainer.appendChild(cancelButton);

    content.appendChild(title);
    content.appendChild(details);
    content.appendChild(buttonsContainer);

    modal.appendChild(content);
    overlay.appendChild(modal);

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .rc-test-store-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }
      
      .rc-test-store-modal {
        background: white;
        border-radius: 8px;
        padding: 0;
        max-width: 500px;
        width: 90%;
        max-height: 90%;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }
      
      .rc-test-store-modal-content {
        padding: 24px;
      }
      
      .rc-test-store-modal-title {
        margin: 0 0 20px 0;
        font-size: 24px;
        font-weight: 600;
        color: #333;
      }
      
      .rc-test-store-modal-details {
        margin-bottom: 24px;
      }
      
      .rc-test-store-modal-details p {
        margin: 8px 0;
        color: #666;
        line-height: 1.5;
      }
      
      .rc-test-store-modal-buttons {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .rc-test-store-modal-button {
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      
      .rc-test-store-modal-button-primary {
        background-color: #007AFF;
        color: white;
      }
      
      .rc-test-store-modal-button-primary:hover {
        background-color: #0056CC;
      }
      
      .rc-test-store-modal-button-secondary {
        background-color: #FF3B30;
        color: white;
      }
      
      .rc-test-store-modal-button-secondary:hover {
        background-color: #CC2E24;
      }
      
      .rc-test-store-modal-button-cancel {
        background-color: #F2F2F7;
        color: #333;
      }
      
      .rc-test-store-modal-button-cancel:hover {
        background-color: #E5E5EA;
      }
      
      /* Mobile responsive - full screen on small screens */
      @media (max-width: 768px) {
        .rc-test-store-modal-overlay {
          padding: 0;
        }
        
        .rc-test-store-modal {
          width: 100%;
          height: 100%;
          border-radius: 0;
          max-width: none;
          max-height: none;
        }
        
        .rc-test-store-modal-content {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
      }
    `;

    // Add styles to head
    document.head.appendChild(style);

    // Add modal to body
    document.body.appendChild(overlay);
  });
}
