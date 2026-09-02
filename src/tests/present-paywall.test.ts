import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mount } from "svelte";
import type { Offering } from "../entities/offerings";
import type { PurchaseResult } from "../entities/purchase-result";
import { configurePurchases } from "./base.purchases_test";
import { createMonthlyPackageMock } from "./mocks/offering-mock-provider";

vi.mock("svelte", () => ({
  mount: vi.fn(),
  unmount: vi.fn(),
}));

type PaywallMountProps = {
  onPurchaseClicked: (selectedPackageId: string) => void;
};

const createOfferingWithPaywall = (): Offering => {
  const monthlyPackage = createMonthlyPackageMock();

  return {
    identifier: "paywall-offering-id",
    serverDescription: "paywall offering",
    metadata: null,
    packagesById: {
      [monthlyPackage.identifier]: monthlyPackage,
    },
    availablePackages: [monthlyPackage],
    lifetime: null,
    annual: null,
    sixMonth: null,
    threeMonth: null,
    twoMonth: null,
    monthly: monthlyPackage,
    weekly: null,
    hasPaywall: true,
    paywallComponents: {
      id: "paywall-public-id",
      default_locale: "en_US",
      components_localizations: {
        en_US: {},
      },
    } as unknown as Offering["paywallComponents"],
    uiConfig: {} as Offering["uiConfig"],
  };
};

describe("Purchases.presentPaywall()", () => {
  let paywallProps: PaywallMountProps | undefined;

  beforeEach(() => {
    paywallProps = undefined;
    vi.mocked(mount).mockImplementation((_component, options) => {
      paywallProps = options.props as PaywallMountProps;
      (options.target as Element).innerHTML =
        "<div data-testid='paywall-root'></div>";
      return {} as ReturnType<typeof mount>;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  test("forwards an external purchase token ID to purchases started from the paywall", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const packageId = offering.availablePackages[0]!.identifier;
    const purchaseSpy = vi
      .spyOn(purchases, "purchase")
      .mockResolvedValue({} as PurchaseResult);

    void purchases.presentPaywall({
      offering,
      externalPurchaseTokenId: "rcat_external_purchase_token_123",
    });

    await vi.waitFor(() => expect(paywallProps).toBeDefined());
    paywallProps!.onPurchaseClicked(packageId);

    await vi.waitFor(() => {
      expect(purchaseSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          externalPurchaseTokenId: "rcat_external_purchase_token_123",
        }),
      );
    });
  });

  test("forwards an external purchase token ID to paywall express checkout", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();
    const getWalletButtonRenderSpy = vi.spyOn(
      purchases,
      "getWalletButtonRender",
    );

    void purchases.presentPaywall({
      offering,
      externalPurchaseTokenId: "rcat_external_purchase_token_123",
    });

    await vi.waitFor(() => {
      expect(getWalletButtonRenderSpy).toHaveBeenCalledWith(
        offering,
        expect.any(Function),
        undefined,
        expect.any(Function),
        undefined,
        undefined,
        "rcat_external_purchase_token_123",
      );
    });
  });
});
