import { describe, expect, test } from "vitest";
import type { PricePreviewResponse } from "@paddle/paddle-js";
import {
  toDiscountPhaseFromPricePreview,
  withPaddleDiscountsOnOffering,
} from "../../paddle/paddle-discount-preview";
import { createMonthlyPackageMock } from "../mocks/offering-mock-provider";
import { buildOffering } from "../utils/fixtures-utils";
import { buildVariablesPerPackage } from "../../helpers/paywall-variables-helpers";
import { parseOfferingIntoPackageInfoPerPackage } from "../../helpers/paywall-package-info-helpers";
import { PeriodUnit } from "../../helpers/duration-helper";
import type { DiscountPhase, Price } from "../../entities/offerings";

type LineItem = PricePreviewResponse["data"]["details"]["lineItems"][number];
type Discount = LineItem["discounts"][number]["discount"];

const baseDiscount: Discount = {
  id: "dsc_01test",
  status: "active",
  description: "Launch promo",
  enabledForCheckout: true,
  code: "LAUNCH",
  type: "percentage",
  amount: "20",
  currencyCode: null,
  recur: false,
  maximumRecurringIntervals: null,
  usageLimit: null,
  restrictTo: null,
  expiresAt: null,
  timesUsed: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

function buildResponse({
  currencyCode = "USD",
  subtotal = "300",
  discount = "60",
  discounts = [
    { discount: baseDiscount, total: "60", formattedTotal: "$0.60" },
  ],
  billingCycle = {
    interval: "month",
    frequency: 1,
  } as LineItem["price"]["billingCycle"],
}: {
  currencyCode?: string;
  subtotal?: string;
  discount?: string;
  discounts?: LineItem["discounts"];
  billingCycle?: LineItem["price"]["billingCycle"];
} = {}): PricePreviewResponse {
  const totals = {
    subtotal,
    discount,
    tax: "0",
    total: String(Number(subtotal) - Number(discount)),
  };
  const lineItem = {
    price: { id: "pri_01test", billingCycle },
    quantity: 1,
    taxRate: "0",
    unitTotals: totals,
    formattedUnitTotals: totals,
    totals,
    formattedTotals: totals,
    product: { id: "pro_01test", name: "Monthly" },
    discounts,
  } as unknown as LineItem;

  return {
    data: {
      customerId: null,
      addressId: null,
      businessId: null,
      currencyCode:
        currencyCode as PricePreviewResponse["data"]["currencyCode"],
      address: null,
      customerIpAddress: null,
      discountId: discounts.length ? discounts[0].discount.id : null,
      details: { lineItems: [lineItem] },
      availablePaymentMethods: [],
    },
    meta: { requestId: "req_01test" },
  };
}

const basePrice: Price = {
  amount: 300,
  amountMicros: 3_000_000,
  currency: "USD",
  formattedPrice: "$3.00",
};

describe("toDiscountPhaseFromPricePreview", () => {
  test("maps a one-time percentage discount", () => {
    const phase = toDiscountPhaseFromPricePreview(
      buildResponse(),
      "P1M",
      basePrice,
    );

    expect(phase).toEqual<DiscountPhase>({
      durationMode: "one_time",
      timeWindow: null,
      price: {
        amount: 240,
        amountMicros: 2_400_000,
        currency: "USD",
        formattedPrice: "$2.40",
      },
      name: "Launch promo",
      periodDuration: "P1M",
      period: { number: 1, unit: PeriodUnit.Month },
      cycleCount: 0,
      discountType: "percentage",
      percentage: 20,
      fixedAmount: null,
    });
  });

  test("maps a recurring flat discount with a cycle limit", () => {
    const response = buildResponse({
      discount: "100",
      discounts: [
        {
          discount: {
            ...baseDiscount,
            type: "flat",
            amount: "100",
            currencyCode: "USD" as Discount["currencyCode"],
            recur: true,
            maximumRecurringIntervals: 3,
          },
          total: "100",
          formattedTotal: "$1.00",
        },
      ],
    });

    const phase = toDiscountPhaseFromPricePreview(response, "P1M", basePrice);

    expect(phase?.durationMode).toBe("time_window");
    expect(phase?.cycleCount).toBe(3);
    expect(phase?.timeWindow).toBe("P1M");
    expect(phase?.discountType).toBe("fixed_amount");
    expect(phase?.percentage).toBeNull();
    expect(phase?.fixedAmount?.amountMicros).toBe(1_000_000);
    expect(phase?.price.amountMicros).toBe(2_000_000);
  });

  test("maps a forever recurring discount", () => {
    const response = buildResponse({
      discounts: [
        {
          discount: { ...baseDiscount, recur: true },
          total: "60",
          formattedTotal: "$0.60",
        },
      ],
    });

    expect(
      toDiscountPhaseFromPricePreview(response, "P1M", basePrice)?.durationMode,
    ).toBe("forever");
  });

  test("uses the fallback period when Paddle has no billing cycle", () => {
    const phase = toDiscountPhaseFromPricePreview(
      buildResponse({ billingCycle: null }),
      "P1Y",
      basePrice,
    );

    expect(phase?.periodDuration).toBe("P1Y");
    expect(phase?.period).toEqual({ number: 1, unit: PeriodUnit.Year });
  });

  test("returns null when no discount was applied", () => {
    expect(
      toDiscountPhaseFromPricePreview(
        buildResponse({ discount: "0", discounts: [] }),
        "P1M",
        basePrice,
      ),
    ).toBeNull();
  });

  test("derives the offer price from the displayed price for tax-inclusive pricing", () => {
    // $29.99 catalog price in a 22% VAT-inclusive country: Paddle discounts
    // the pre-tax subtotal ($24.58) and charges $14.99 in total.
    const response = buildResponse({
      subtotal: "2458",
      discount: "1229",
      discounts: [
        {
          discount: { ...baseDiscount, amount: "50" },
          total: "1229",
          formattedTotal: "$12.29",
        },
      ],
    });

    const phase = toDiscountPhaseFromPricePreview(response, "P1M", {
      amount: 2999,
      amountMicros: 29_990_000,
      currency: "USD",
      formattedPrice: "$29.99",
    });

    expect(phase?.price.amountMicros).toBe(14_990_000);
    expect(phase?.price.formattedPrice).toBe("$14.99");
  });

  test("keeps exact results for tax-exclusive flat discounts", () => {
    // $29.99 with no tax, $10.00 off → $19.99.
    const response = buildResponse({
      subtotal: "2999",
      discount: "1000",
      discounts: [
        {
          discount: {
            ...baseDiscount,
            type: "flat",
            amount: "1000",
            currencyCode: "USD" as Discount["currencyCode"],
          },
          total: "1000",
          formattedTotal: "$10.00",
        },
      ],
    });

    const phase = toDiscountPhaseFromPricePreview(response, "P1M", {
      amount: 2999,
      amountMicros: 29_990_000,
      currency: "USD",
      formattedPrice: "$29.99",
    });

    expect(phase?.price.amountMicros).toBe(19_990_000);
    expect(phase?.fixedAmount?.amountMicros).toBe(10_000_000);
  });

  test("rounds to whole units for zero-decimal currencies", () => {
    // ¥1500 with 20% off → ¥1200.
    const response = buildResponse({
      currencyCode: "JPY",
      subtotal: "1500",
      discount: "300",
      discounts: [
        { discount: baseDiscount, total: "300", formattedTotal: "¥300" },
      ],
    });

    const phase = toDiscountPhaseFromPricePreview(response, "P1M", {
      amount: 1500,
      amountMicros: 1_500_000_000,
      currency: "JPY",
      formattedPrice: "¥1,500",
    });

    expect(phase?.price.amountMicros).toBe(1_200_000_000);
  });
});

describe("withPaddleDiscountsOnOffering", () => {
  const discount = toDiscountPhaseFromPricePreview(
    buildResponse(),
    "P1M",
    basePrice,
  )!;

  test("applies the discount to the matching package only", () => {
    const monthly = createMonthlyPackageMock();
    const other = {
      ...createMonthlyPackageMock(),
      identifier: "$rc_annual",
    };
    const offering = buildOffering([monthly, other]);

    const result = withPaddleDiscountsOnOffering(offering, {
      $rc_monthly: discount,
    });

    const patched = result.packagesById["$rc_monthly"].webBillingProduct;
    expect(patched.defaultSubscriptionOption?.discount).toEqual(discount);
    expect(patched.subscriptionOptions["base_option"].discount).toEqual(
      discount,
    );
    expect(patched.discountPhase).toEqual(discount);
    expect(result.monthly?.webBillingProduct.discountPhase).toEqual(discount);
    expect(result.availablePackages[0].webBillingProduct.discountPhase).toEqual(
      discount,
    );

    expect(
      result.packagesById["$rc_annual"].webBillingProduct.discountPhase,
    ).toBeNull();
    expect(
      offering.packagesById["$rc_monthly"].webBillingProduct.discountPhase,
    ).toBeNull();
  });

  test("surfaces the discount through paywall variables and package info", () => {
    const offering = withPaddleDiscountsOnOffering(
      buildOffering([createMonthlyPackageMock()]),
      { $rc_monthly: discount },
    );

    const variables = buildVariablesPerPackage(offering)["$rc_monthly"];
    expect(variables["product.price"]).toBe("$3.00");
    expect(variables["product.offer_price"]).toBe("$2.40");

    const info =
      parseOfferingIntoPackageInfoPerPackage(offering)["$rc_monthly"];
    expect(info.hasPromoOffer).toBe(true);
  });
});
