import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mount } from "svelte";
import { configurePurchases } from "./base.purchases_test";
import { createMonthlyPackageMock } from "./mocks/offering-mock-provider";
import { Purchases } from "../main";
import type { Offering, Package } from "../entities/offerings";

vi.mock("svelte", () => ({
  mount: vi.fn(),
  unmount: vi.fn(),
}));

const createOfferingWithPaywall = (
  availablePackages: Package[] = [createMonthlyPackageMock()],
): Offering => {
  const monthlyPackage =
    availablePackages.find((pkg) => pkg.identifier === "$rc_monthly") ??
    availablePackages[0]!;
  const annualPackage =
    availablePackages.find((pkg) => pkg.identifier === "$rc_annual") ?? null;

  return {
    identifier: "paywall-offering-id",
    serverDescription: "paywall offering",
    metadata: null,
    packagesById: Object.fromEntries(
      availablePackages.map((pkg) => [pkg.identifier, pkg]),
    ),
    availablePackages,
    lifetime: null,
    annual: annualPackage,
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

describe("Purchases.presentPaywall() paywall context", () => {
  let mountedProps: Record<string, unknown> | undefined;

  beforeEach(() => {
    mountedProps = undefined;
    vi.mocked(mount).mockImplementation((_component, options) => {
      mountedProps = options.props as Record<string, unknown>;
      (options.target as Element).innerHTML =
        "<div data-testid='paywall-root'></div>";
      return {} as ReturnType<typeof mount>;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  test("passes offering, packages, and isPreview on the Paywall mount", async () => {
    const purchases = configurePurchases();
    const offering = createOfferingWithPaywall();

    void purchases.presentPaywall({ offering });

    await vi.waitFor(() => expect(mountedProps).toBeDefined());
    expect(mountedProps?.offering).toEqual({
      identifier: offering.identifier,
      display_name: offering.serverDescription,
    });
    expect(mountedProps?.packages).toEqual(
      Purchases.buildPaywallContextPackages(offering),
    );
    expect(mountedProps?.isPreview).toBe(false);
    expect(mountedProps).not.toHaveProperty("workflow");
  });
});
