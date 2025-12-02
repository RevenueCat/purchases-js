import "@testing-library/jest-dom";
import { describe, expect, test, vi } from "vitest";
import { Translator } from "../../ui/localization/translator";
import {
  rcPackage,
  subscriptionOption,
  subscriptionOptionWithIntroPriceRecurring,
} from "../../stories/fixtures";
import type { Package } from "../../entities/offerings";
import type { ExpressPurchaseButtonUpdater } from "../../entities/present-express-purchase-button-params";
import { renderExpressPurchaseButton } from "../../ui/express-purchase-button/express-purchase-button-wrapper.svelte";

vi.mock(
  "../../ui/express-purchase-button/express-purchase-button.svelte",
  () => import("../mocks/express-purchase-button-mock.svelte"),
);

describe("renderExpressPurchaseButton", () => {
  test("renders and updates purchase details", async () => {
    const htmlTarget = document.createElement("div");
    document.body.appendChild(htmlTarget);
    const onButtonReady = vi.fn();

    renderExpressPurchaseButton(htmlTarget, onButtonReady, {
      appUserId: "test-user",
      rcPackage,
      purchaseOption: subscriptionOption,
      customerEmail: "user@example.com",
      purchases: {} as unknown as Record<string, never>,
      eventsTracker: {} as unknown as Record<string, never>,
      purchaseOperationHelper: {} as unknown as Record<string, never>,
      metadata: undefined,
      brandingInfo: null,
      customTranslations: undefined,
      translator: new Translator(),
      onFinished: vi.fn(),
      onError: vi.fn(),
    });

    const updater = onButtonReady.mock
      .calls[0][0] as ExpressPurchaseButtonUpdater;

    const button = htmlTarget.querySelector(
      '[data-testid="express-purchase-button"]',
    );
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-package-id", rcPackage.identifier);
    expect(button).toHaveAttribute(
      "data-purchase-option-id",
      subscriptionOption.id,
    );

    const updatedProduct = {
      ...rcPackage.webBillingProduct,
      identifier: "updated-product",
      defaultPurchaseOption: subscriptionOptionWithIntroPriceRecurring,
      defaultSubscriptionOption: subscriptionOptionWithIntroPriceRecurring,
      subscriptionOptions: {
        [subscriptionOptionWithIntroPriceRecurring.id]:
          subscriptionOptionWithIntroPriceRecurring,
      },
    };
    const updatedPackage: Package = {
      ...rcPackage,
      identifier: "updated-package",
      rcBillingProduct: updatedProduct,
      webBillingProduct: updatedProduct,
    };

    updater.updatePurchase(updatedPackage);
    await Promise.resolve();

    const updatedButton = htmlTarget.querySelector(
      '[data-testid="express-purchase-button"]',
    );
    expect(updatedButton).toHaveAttribute("data-package-id", "updated-package");
    expect(updatedButton).toHaveAttribute(
      "data-purchase-option-id",
      subscriptionOptionWithIntroPriceRecurring.id,
    );

    document.body.innerHTML = "";
  });
});
