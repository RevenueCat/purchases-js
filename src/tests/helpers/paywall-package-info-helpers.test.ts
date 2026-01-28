import { describe, expect, test } from "vitest";
import { parseOfferingIntoPackageInfoPerPackage } from "../../helpers/paywall-package-info-helpers";
import { PeriodUnit } from "../../helpers/duration-helper";
import { toOffering } from "../utils/fixtures-utils";
import type {
  PricingPhase,
  SubscriptionOption,
} from "../../entities/offerings";

describe("parseOfferingIntoPackageInfoPerPackage", () => {
  const trial: SubscriptionOption["trial"] = {
    period: { unit: PeriodUnit.Week, number: 2 },
    periodDuration: "P2W",
    cycleCount: 1,
    price: null,
    pricePerWeek: null,
    pricePerMonth: null,
    pricePerYear: null,
    name: null,
  } satisfies PricingPhase;

  const introPrice: SubscriptionOption["introPrice"] = {
    period: { unit: PeriodUnit.Month, number: 2 },
    periodDuration: "P2M",
    cycleCount: 1,
    price: {
      amount: 4500,
      amountMicros: 4500000,
      currency: "EUR",
      formattedPrice: "45.00€",
    },
    pricePerWeek: null,
    pricePerMonth: null,
    pricePerYear: null,
    name: null,
  } satisfies PricingPhase;

  const discountPrice: SubscriptionOption["discountPrice"] = {
    timeWindow: "P1M",
    durationMode: "time_window",
    price: {
      amount: 3000,
      amountMicros: 3000000,
      currency: "EUR",
      formattedPrice: "30.00€",
    },
    name: "Black Friday 50%",
  };

  test("Packages with no trial and no intro offer", () => {
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_basic",
        title: "Monthly Basic",
      },
    ]);

    const result = parseOfferingIntoPackageInfoPerPackage(off);

    expect(result).toEqual(
      expect.objectContaining({
        $rc_monthly: expect.objectContaining({
          hasTrial: false,
          hasDiscount: false,
          hasIntroOffer: false,
        }),
      }),
    );
  });

  test("Packages with only trial", () => {
    const off = toOffering([
      {
        packageIdentifier: "$rc_weekly",
        identifier: "weekly_trial",
        title: "Weekly Trial",
        trial,
      },
    ]);

    const result = parseOfferingIntoPackageInfoPerPackage(off);

    expect(result).toEqual(
      expect.objectContaining({
        $rc_weekly: expect.objectContaining({
          hasTrial: true,
          hasDiscount: false,
          hasIntroOffer: false,
        }),
      }),
    );
  });

  test("Packages with only intro offer", () => {
    const off = toOffering([
      {
        packageIdentifier: "$rc_yearly",
        identifier: "yearly_intro",
        title: "Yearly Intro",
        introPrice,
      },
    ]);

    const result = parseOfferingIntoPackageInfoPerPackage(off);

    expect(result).toEqual(
      expect.objectContaining({
        $rc_yearly: expect.objectContaining({
          hasTrial: false,
          hasDiscount: false,
          hasIntroOffer: true,
        }),
      }),
    );
  });

  test("Packages with both trial and intro offer", () => {
    const off = toOffering([
      {
        packageIdentifier: "custom_both",
        identifier: "custom_both_id",
        title: "Custom Both",
        trial,
        introPrice,
      },
    ]);

    const result = parseOfferingIntoPackageInfoPerPackage(off);

    expect(result).toEqual(
      expect.objectContaining({
        custom_both: expect.objectContaining({
          hasTrial: true,
          hasDiscount: false,
          hasIntroOffer: true,
        }),
      }),
    );
  });

  test("Multiple packages with mixed trial/intro combinations", () => {
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_basic",
        title: "Monthly Basic",
      },
      {
        packageIdentifier: "$rc_weekly",
        identifier: "weekly_trial",
        title: "Weekly Trial",
        trial,
      },
      {
        packageIdentifier: "$rc_yearly",
        identifier: "yearly_intro",
        title: "Yearly Intro",
        introPrice,
      },
      {
        packageIdentifier: "custom_both",
        identifier: "custom_both_id",
        title: "Custom Both",
        trial,
        introPrice,
      },
    ]);

    const result = parseOfferingIntoPackageInfoPerPackage(off);

    expect(result).toEqual(
      expect.objectContaining({
        $rc_monthly: expect.objectContaining({
          hasTrial: false,
          hasDiscount: false,
          hasIntroOffer: false,
        }),
        $rc_weekly: expect.objectContaining({
          hasTrial: true,
          hasDiscount: false,
          hasIntroOffer: false,
        }),
        $rc_yearly: expect.objectContaining({
          hasTrial: false,
          hasDiscount: false,
          hasIntroOffer: true,
        }),
        custom_both: expect.objectContaining({
          hasTrial: true,
          hasDiscount: false,
          hasIntroOffer: true,
        }),
      }),
    );
  });

  test("Packages with only discount price", () => {
    const off = toOffering([
      {
        packageIdentifier: "$rc_yearly",
        identifier: "yearly_discount",
        title: "Yearly Discount",
        discountPrice,
      },
    ]);

    const result = parseOfferingIntoPackageInfoPerPackage(off);

    expect(result).toEqual(
      expect.objectContaining({
        $rc_yearly: expect.objectContaining({
          hasTrial: false,
          hasDiscount: true,
          hasIntroOffer: false,
        }),
      }),
    );
  });

  test("Packages with both discount price and intro price", () => {
    const off = toOffering([
      {
        packageIdentifier: "custom_discount_intro",
        identifier: "custom_discount_intro_id",
        title: "Custom Discount + Intro",
        discountPrice,
        introPrice,
      },
    ]);

    const result = parseOfferingIntoPackageInfoPerPackage(off);

    expect(result).toEqual(
      expect.objectContaining({
        custom_discount_intro: expect.objectContaining({
          hasTrial: false,
          hasDiscount: true,
          hasIntroOffer: true,
        }),
      }),
    );
  });

  test("Packages with trial, discount price, and intro price", () => {
    const off = toOffering([
      {
        packageIdentifier: "custom_all",
        identifier: "custom_all_id",
        title: "Custom All",
        trial,
        discountPrice,
        introPrice,
      },
    ]);

    const result = parseOfferingIntoPackageInfoPerPackage(off);

    expect(result).toEqual(
      expect.objectContaining({
        custom_all: expect.objectContaining({
          hasTrial: true,
          hasDiscount: true,
          hasIntroOffer: true,
        }),
      }),
    );
  });
});
