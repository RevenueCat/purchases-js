import { describe, expect, test } from "vitest";
import { buildPaywallContextPackages } from "../../helpers/paywall-context-packages-helpers";
import type { Package, Product } from "../../entities/offerings";
import {
  buildOffering,
  toNonSubscriptionOffering,
  toOffering,
} from "../utils/fixtures-utils";

describe("buildPaywallContextPackages", () => {
  test("maps subscription packages to PaywallPackage[] with major-unit prices", () => {
    const offering = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_basic",
        title: "Monthly Basic",
        basePriceMicros: 9990000,
        currency: "USD",
      },
    ]);

    expect(buildPaywallContextPackages(offering)).toStrictEqual([
      {
        identifier: "$rc_monthly",
        display_name: "Monthly Basic",
        products: [
          {
            identifier: "monthly_basic",
            store: { store_type: "rc_billing" },
            display_name: "Monthly Basic",
            is_subscription: true,
            period: "P1M",
            is_auto_renewing: true,
            price: { amount: 9.99, currency: "USD" },
          },
        ],
      },
    ]);
  });

  test("uses amountMicros / 1_000_000 instead of deprecated Price.amount cents", () => {
    const offering = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_basic",
        title: "Monthly Basic",
        basePriceMicros: 9990000,
        currency: "USD",
      },
    ]);
    const product = offering.availablePackages[0]!.webBillingProduct;
    // Deprecated Price.amount is cents (999). Major units from micros are 9.99.
    expect(product.price.amount).toBe(999);
    expect(product.price.amountMicros).toBe(9990000);

    const [mapped] = buildPaywallContextPackages(offering);
    expect(mapped?.products[0]?.price).toStrictEqual({
      amount: 9.99,
      currency: "USD",
    });
  });

  test("omits price when the product has no price", () => {
    const offering = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_basic",
        title: "Monthly Basic",
      },
    ]);
    const pkg = offering.availablePackages[0]!;
    const productWithoutPrice = {
      ...pkg.webBillingProduct,
      price: undefined,
    } as unknown as Product;
    const stripped: Package = {
      ...pkg,
      webBillingProduct: productWithoutPrice,
      rcBillingProduct: productWithoutPrice,
    };

    const [mapped] = buildPaywallContextPackages(buildOffering([stripped]));
    expect(mapped?.products[0]?.price).toBeUndefined();
    expect(mapped?.products[0]).not.toHaveProperty("price");
  });

  test("omits is_auto_renewing and period for non-subscription packages", () => {
    const offering = toNonSubscriptionOffering([
      {
        packageIdentifier: "lifetime",
        identifier: "lifetime_basic",
        title: "Lifetime Basic",
        basePriceMicros: 49990000,
        currency: "EUR",
      },
    ]);

    expect(buildPaywallContextPackages(offering)).toStrictEqual([
      {
        identifier: "lifetime",
        display_name: "Lifetime Basic",
        products: [
          {
            identifier: "lifetime_basic",
            store: { store_type: "rc_billing" },
            display_name: "Lifetime Basic",
            is_subscription: false,
            price: { amount: 49.99, currency: "EUR" },
          },
        ],
      },
    ]);
  });

  test("falls back to package identifier when the product title is empty", () => {
    const offering = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_basic",
        title: "",
      },
    ]);

    const [mapped] = buildPaywallContextPackages(offering);
    expect(mapped?.display_name).toBe("$rc_monthly");
    expect(mapped?.products[0]?.display_name).toBe("monthly_basic");
  });

  test("omits country and is_family_shareable", () => {
    const offering = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_basic",
        title: "Monthly Basic",
      },
    ]);

    const product = buildPaywallContextPackages(offering)[0]?.products[0];
    expect(product?.store).toStrictEqual({ store_type: "rc_billing" });
    expect(product?.store).not.toHaveProperty("country");
    expect(product).not.toHaveProperty("is_family_shareable");
  });

  test("preserves availablePackages order", () => {
    const offering = toOffering([
      {
        packageIdentifier: "$rc_annual",
        identifier: "annual_basic",
        title: "Annual Basic",
      },
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_basic",
        title: "Monthly Basic",
      },
    ]);

    expect(
      buildPaywallContextPackages(offering).map((pkg) => pkg.identifier),
    ).toEqual(["$rc_annual", "$rc_monthly"]);
  });

  test("returns an empty list when the offering has no packages", () => {
    expect(buildPaywallContextPackages(buildOffering([]))).toStrictEqual([]);
  });
});
