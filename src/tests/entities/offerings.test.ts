import { afterEach, describe, expect, test, vi } from "vitest";
import {
  packageProductIdentifier,
  ProductType,
  toOffering,
  toPurchaseOptionForProductType,
} from "../../entities/offerings";
import type {
  NonSubscriptionOptionResponse,
  SubscriptionOptionResponse,
} from "../../networking/responses/products-response";
import type { PackageResponse } from "../../networking/responses/offerings-response";
import { productsResponse } from "../test-responses";

const subscriptionOptionResponse: SubscriptionOptionResponse = {
  id: "sub_option",
  price_id: "sub_price",
  base: {
    cycle_count: 1,
    period_duration: "P1M",
    price: {
      amount_micros: 9990000,
      currency: "USD",
    },
  },
  trial: null,
  intro_price: null,
  discount: null,
};

const nonSubscriptionOptionResponse: NonSubscriptionOptionResponse = {
  id: "nonsub_option",
  price_id: "nonsub_price",
  base_price: {
    amount_micros: 4990000,
    currency: "USD",
  },
  discount: null,
};

describe("toPurchaseOptionForProductType", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("returns a subscription option when a subscription option is used for a subscription product", () => {
    const result = toPurchaseOptionForProductType(
      ProductType.Subscription,
      subscriptionOptionResponse,
    );

    expect(result).toMatchObject({
      id: "sub_option",
      priceId: "sub_price",
      base: {
        cycleCount: 1,
        periodDuration: "P1M",
        price: expect.objectContaining({
          amountMicros: 9990000,
          currency: "USD",
        }),
      },
    });
  });

  test("returns null when a subscription option is missing its base phase", () => {
    const result = toPurchaseOptionForProductType(ProductType.Subscription, {
      ...subscriptionOptionResponse,
      base: null,
    });

    expect(result).toBeNull();
  });

  test("returns null when a non-subscription option is used for a subscription product", () => {
    const result = toPurchaseOptionForProductType(
      ProductType.Subscription,
      nonSubscriptionOptionResponse,
    );

    expect(result).toBeNull();
  });

  test("returns null when a subscription option is used for a non-subscription product", () => {
    const result = toPurchaseOptionForProductType(
      ProductType.NonConsumable,
      subscriptionOptionResponse,
    );

    expect(result).toBeNull();
  });
});

describe("packageProductIdentifier", () => {
  test("returns the composite id when the package has a plan identifier", () => {
    const pkg: PackageResponse = {
      identifier: "$rc_weekly",
      platform_product_identifier: "prod_abc",
      platform_product_plan_identifier: "price_weekly",
    };

    expect(packageProductIdentifier(pkg)).toBe("prod_abc:price_weekly");
  });

  test("returns the bare product id when there is no plan identifier", () => {
    const pkg: PackageResponse = {
      identifier: "$rc_annual",
      platform_product_identifier: "prod_legacy",
    };

    expect(packageProductIdentifier(pkg)).toBe("prod_legacy");
  });
});

describe("toOffering with composite products", () => {
  test("resolves a composite package's product by its composite id", () => {
    const compositeProduct = {
      ...productsResponse.product_details[0],
      identifier: "prod_abc:price_weekly",
    };

    const offering = toOffering(
      true,
      {
        identifier: "offering_composite",
        description: "Composite Offering",
        metadata: null,
        paywall_components: null,
        packages: [
          {
            identifier: "$rc_weekly",
            platform_product_identifier: "prod_abc",
            platform_product_plan_identifier: "price_weekly",
          },
        ],
      },
      {
        "prod_abc:price_weekly": compositeProduct,
      },
    );

    expect(offering?.availablePackages).toHaveLength(1);
    expect(offering?.availablePackages[0].webBillingProduct.identifier).toBe(
      "prod_abc:price_weekly",
    );
  });
});
