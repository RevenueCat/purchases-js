import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mount } from "svelte";
import { configurePurchases } from "./base.purchases_test";
import { createMonthlyPackageMock } from "./mocks/offering-mock-provider";
import type { Purchases } from "../main";
import type { Offering, Package } from "../entities/offerings";
import type { PaywallPurchaseResult } from "../entities/purchase-result";
import type { ExpressPurchaseButtonProps } from "../ui/express-purchase-button/express-purchase-button-props";

vi.mock("svelte", () => ({
  mount: vi.fn(),
  unmount: vi.fn(),
}));

const monthlyPackage = createMonthlyPackageMock();
const annualPackage: Package = {
  ...monthlyPackage,
  identifier: "$rc_annual",
  rcBillingProduct: {
    ...monthlyPackage.rcBillingProduct,
    identifier: "annual",
  },
  webBillingProduct: {
    ...monthlyPackage.webBillingProduct,
    identifier: "annual",
  },
};

const offering = {
  packagesById: {
    [monthlyPackage.identifier]: monthlyPackage,
    [annualPackage.identifier]: annualPackage,
  },
} as unknown as Offering;

describe("Purchases.getWalletButtonRender()", () => {
  let purchases: Purchases;
  let buttonProps: ExpressPurchaseButtonProps | undefined;
  let onSuccess: ReturnType<
    typeof vi.fn<(result: PaywallPurchaseResult) => void>
  >;

  beforeEach(() => {
    purchases = configurePurchases();
    buttonProps = undefined;
    onSuccess = vi.fn();
    vi.mocked(mount).mockImplementation((_component, options) => {
      buttonProps = options.props as ExpressPurchaseButtonProps;
      return {} as ReturnType<typeof mount>;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderButton = async () => {
    const render = purchases.getWalletButtonRender(offering, onSuccess);
    const action = render!(document.createElement("div"), {
      selectedPackageId: monthlyPackage.identifier,
      onReady: vi.fn(),
    });
    await vi.waitFor(() => expect(buttonProps).toBeDefined());
    // Simulates the wallet button becoming ready, which delivers the updater.
    buttonProps!.onReady?.(true);
    return action;
  };

  const completePurchase = (purchasedPackage: Package) => {
    buttonProps!.onFinished({
      redemptionInfo: null,
      operationSessionId: "test-operation-session-id",
      storeTransactionIdentifier: "test-store-transaction-id",
      productIdentifier: purchasedPackage.webBillingProduct.identifier,
      purchaseDate: new Date("2024-01-01T00:00:00.000Z"),
    });
  };

  test("reports the package selected at purchase time after switching packages", async () => {
    const action = await renderButton();

    action.update?.({ selectedPackageId: annualPackage.identifier });
    completePurchase(annualPackage);

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled());
    const result = onSuccess.mock.calls[0]![0];
    expect(result.selectedPackage).toBe(annualPackage);
    expect(result.storeTransaction.productIdentifier).toBe("annual");
  });

  test("reports the initially selected package when it is never switched", async () => {
    await renderButton();

    completePurchase(monthlyPackage);

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled());
    const result = onSuccess.mock.calls[0]![0];
    expect(result.selectedPackage).toBe(monthlyPackage);
    expect(result.storeTransaction.productIdentifier).toBe("monthly");
  });
});
