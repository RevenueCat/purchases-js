import { describe, expect, test } from "vitest";
import { parseOfferingIntoPackageInfoPerPackage } from "../../helpers/paywall-package-info-helpers";
import { toOffering, toNonSubscriptionOffering } from "../utils/fixtures-utils";
import {
  discountPhaseOneTime,
  trialPhaseP2W,
  pricePhaseP1M1499,
} from "../fixtures/price-phases";

describe("parseOfferingIntoPackageInfoPerPackage", () => {
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
        trial: trialPhaseP2W,
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
        introPrice: pricePhaseP1M1499,
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
        trial: trialPhaseP2W,
        introPrice: pricePhaseP1M1499,
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

  test("Packages with only discount price", () => {
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_discount",
        title: "Monthly Discount",
        discountPrice: discountPhaseOneTime,
      },
    ]);

    const result = parseOfferingIntoPackageInfoPerPackage(off);
    expect(result).toStrictEqual({
      $rc_monthly: {
        hasTrial: false,
        hasIntroOffer: true,
      },
    });
  });

  test("Non-subscription packages with discount price", () => {
    const off = toNonSubscriptionOffering([
      {
        packageIdentifier: "lifetime",
        identifier: "lifetime_discount",
        title: "Lifetime Discount",
        discountPrice: discountPhaseOneTime,
      },
    ]);

    const result = parseOfferingIntoPackageInfoPerPackage(off);

    expect(result).toStrictEqual({
      lifetime: {
        hasTrial: false,
        hasIntroOffer: true,
      },
    });
  });

  test("Non-subscription packages without discount price", () => {
    const off = toNonSubscriptionOffering([
      {
        packageIdentifier: "lifetime",
        identifier: "lifetime_basic",
        title: "Lifetime Basic",
      },
    ]);

    const result = parseOfferingIntoPackageInfoPerPackage(off);

    expect(result).toStrictEqual({
      lifetime: {
        hasTrial: false,
        hasIntroOffer: false,
      },
    });
  });

  test("Multiple packages with mixed trial/intro/discount combinations", () => {
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
        trial: trialPhaseP2W,
      },
      {
        packageIdentifier: "$rc_yearly",
        identifier: "yearly_intro",
        title: "Yearly Intro",
        introPrice: pricePhaseP1M1499,
      },
      {
        packageIdentifier: "custom_both",
        identifier: "custom_both_id",
        title: "Custom Both",
        trial: trialPhaseP2W,
        introPrice: pricePhaseP1M1499,
      },
      {
        packageIdentifier: "discount_only",
        identifier: "discount_only_id",
        title: "Discount Only",
        discountPrice: discountPhaseOneTime,
      },
    ]);

    const result = parseOfferingIntoPackageInfoPerPackage(off);

    expect(result).toStrictEqual({
      $rc_monthly: {
        hasTrial: false,
        hasIntroOffer: false,
      },
      $rc_weekly: {
        hasTrial: true,
        hasIntroOffer: false,
      },
      $rc_yearly: {
        hasTrial: false,
        hasIntroOffer: true,
      },
      custom_both: {
        hasTrial: true,
        hasIntroOffer: true,
      },
      discount_only: {
        hasTrial: false,
        hasIntroOffer: true,
      },
    });
  });
});
