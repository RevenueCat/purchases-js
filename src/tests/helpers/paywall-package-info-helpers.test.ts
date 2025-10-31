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
  } satisfies PricingPhase;

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
          hasIntroOffer: false,
        }),
        $rc_weekly: expect.objectContaining({
          hasTrial: true,
          hasIntroOffer: false,
        }),
        $rc_yearly: expect.objectContaining({
          hasTrial: false,
          hasIntroOffer: true,
        }),
        custom_both: expect.objectContaining({
          hasTrial: true,
          hasIntroOffer: true,
        }),
      }),
    );
  });
});
