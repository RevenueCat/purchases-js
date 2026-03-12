import { describe, expect, test } from "vitest";
import { parseOfferingIntoPackageInfoPerPackage } from "../../helpers/paywall-package-info-helpers";
import { toOffering, toNonSubscriptionOffering } from "../utils/fixtures-utils";
import {
  discountPhaseOneTime,
  trialPhaseP2W,
  pricePhaseP1M1499,
} from "../fixtures/price-phases";

describe("parseOfferingIntoPackageInfoPerPackage", () => {
  test("Packages with no trial, no intro offer, and no promo offer", () => {
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_basic",
        title: "Monthly Basic",
      },
    ]);

    const result = parseOfferingIntoPackageInfoPerPackage(off);

    expect(result).toStrictEqual({
      $rc_monthly: {
        hasTrial: false,
        hasIntroOffer: false,
        hasPromoOffer: false,
      },
    });
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

    expect(result).toStrictEqual({
      $rc_weekly: {
        hasTrial: true,
        hasIntroOffer: false,
        hasPromoOffer: false,
      },
    });
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

    expect(result).toStrictEqual({
      $rc_yearly: {
        hasTrial: false,
        hasIntroOffer: true,
        hasPromoOffer: false,
      },
    });
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

    expect(result).toStrictEqual({
      custom_both: {
        hasTrial: true,
        hasIntroOffer: true,
        hasPromoOffer: false,
      },
    });
  });

  test("Packages with only promo offer (discount)", () => {
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_discount",
        title: "Monthly Discount",
        discount: discountPhaseOneTime,
      },
    ]);

    const result = parseOfferingIntoPackageInfoPerPackage(off);
    expect(result).toStrictEqual({
      $rc_monthly: {
        hasTrial: false,
        hasIntroOffer: false,
        hasPromoOffer: true,
      },
    });
  });

  test("Non-subscription packages with promo offer (discount)", () => {
    const off = toNonSubscriptionOffering([
      {
        packageIdentifier: "lifetime",
        identifier: "lifetime_discount",
        title: "Lifetime Discount",
        discount: discountPhaseOneTime,
      },
    ]);

    const result = parseOfferingIntoPackageInfoPerPackage(off);

    expect(result).toStrictEqual({
      lifetime: {
        hasTrial: false,
        hasIntroOffer: false,
        hasPromoOffer: true,
      },
    });
  });

  test("Non-subscription packages without promo offer", () => {
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
        hasPromoOffer: false,
      },
    });
  });

  test("Multiple packages with mixed trial/intro/promo combinations", () => {
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
        packageIdentifier: "promo_only",
        identifier: "promo_only_id",
        title: "Promo Only",
        discount: discountPhaseOneTime,
      },
    ]);

    const result = parseOfferingIntoPackageInfoPerPackage(off);

    expect(result).toStrictEqual({
      $rc_monthly: {
        hasTrial: false,
        hasIntroOffer: false,
        hasPromoOffer: false,
      },
      $rc_weekly: {
        hasTrial: true,
        hasIntroOffer: false,
        hasPromoOffer: false,
      },
      $rc_yearly: {
        hasTrial: false,
        hasIntroOffer: true,
        hasPromoOffer: false,
      },
      custom_both: {
        hasTrial: true,
        hasIntroOffer: true,
        hasPromoOffer: false,
      },
      promo_only: {
        hasTrial: false,
        hasIntroOffer: false,
        hasPromoOffer: true,
      },
    });
  });
});
