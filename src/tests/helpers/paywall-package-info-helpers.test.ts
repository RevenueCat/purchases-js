import { describe, expect, test } from "vitest";
import type { PackageInfo } from "@revenuecat/purchases-ui-js";
import { parseOfferingIntoPackageInfoPerPackage } from "../../helpers/paywall-package-info-helpers";
import type { Offering } from "../../entities/offerings";
import { toOffering, toNonSubscriptionOffering } from "../utils/fixtures-utils";
import { PeriodUnit } from "../../helpers/duration-helper";
import { englishLocale } from "../../ui/localization/constants";
import { Translator } from "../../ui/localization/translator";
import {
  discountPhaseOneTime,
  trialPhaseP2W,
  pricePhaseP1M1499,
} from "../fixtures/price-phases";

type PackageInfoWithCheckout = PackageInfo & { webCheckoutURL?: string };

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
        pricePerMonthMicros: 9_000_000,
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
        pricePerMonthMicros: 9_000_000,
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
        pricePerMonthMicros: 9_000_000,
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
        pricePerMonthMicros: 9_000_000,
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
        pricePerMonthMicros: 9_000_000,
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
        pricePerMonthMicros: 9_000_000,
      },
      $rc_weekly: {
        hasTrial: true,
        hasIntroOffer: false,
        hasPromoOffer: false,
        pricePerMonthMicros: 9_000_000,
      },
      $rc_yearly: {
        hasTrial: false,
        hasIntroOffer: true,
        hasPromoOffer: false,
        pricePerMonthMicros: 9_000_000,
      },
      custom_both: {
        hasTrial: true,
        hasIntroOffer: true,
        hasPromoOffer: false,
        pricePerMonthMicros: 9_000_000,
      },
      promo_only: {
        hasTrial: false,
        hasIntroOffer: false,
        hasPromoOffer: true,
        pricePerMonthMicros: 9_000_000,
      },
    });
  });

  test("includes webCheckoutURL from package when present", () => {
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_basic",
        title: "Monthly Basic",
      },
    ]);
    const monthly = off.packagesById["$rc_monthly"]!;
    off.packagesById["$rc_monthly"] = {
      ...monthly,
      webCheckoutURL: "https://checkout.example.com/monthly",
    };

    const result = parseOfferingIntoPackageInfoPerPackage(off) as Record<
      string,
      PackageInfoWithCheckout
    >;

    expect(result).toStrictEqual({
      $rc_monthly: {
        hasTrial: false,
        hasIntroOffer: false,
        hasPromoOffer: false,
        pricePerMonthMicros: 9_000_000,
        webCheckoutURL: "https://checkout.example.com/monthly",
      },
    });
  });

  test("falls back to offering webCheckoutURL when package has none", () => {
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_basic",
        title: "Monthly Basic",
      },
    ]);
    const withOfferingUrl: Offering = {
      ...off,
      webCheckoutURL: "https://checkout.example.com/offering",
    };

    const result = parseOfferingIntoPackageInfoPerPackage(
      withOfferingUrl,
    ) as Record<string, PackageInfoWithCheckout>;

    expect(result).toStrictEqual({
      $rc_monthly: {
        hasTrial: false,
        hasIntroOffer: false,
        hasPromoOffer: false,
        pricePerMonthMicros: 9_000_000,
        webCheckoutURL: "https://checkout.example.com/offering",
      },
    });
  });

  test("package webCheckoutURL takes precedence over offering", () => {
    const off = toOffering([
      {
        packageIdentifier: "$rc_monthly",
        identifier: "monthly_basic",
        title: "Monthly Basic",
      },
    ]);
    const monthly = off.packagesById["$rc_monthly"]!;
    off.packagesById["$rc_monthly"] = {
      ...monthly,
      webCheckoutURL: "https://checkout.example.com/package",
    };
    const withOfferingUrl: Offering = {
      ...off,
      webCheckoutURL: "https://checkout.example.com/offering",
    };

    const result = parseOfferingIntoPackageInfoPerPackage(
      withOfferingUrl,
    ) as Record<string, PackageInfoWithCheckout>;

    expect(result.$rc_monthly?.webCheckoutURL).toBe(
      "https://checkout.example.com/package",
    );
  });
});

describe("discountVariablesByMostExpensivePricePerMonth", () => {
  const translator = new Translator({}, englishLocale);
  const offering = toOffering([
    {
      packageIdentifier: "$rc_monthly",
      identifier: "monthly",
      title: "Monthly",
      period: { unit: PeriodUnit.Month, number: 1 },
      basePriceMicros: 10_000_000,
      currency: "USD",
    },
    {
      packageIdentifier: "$rc_annual",
      identifier: "annual",
      title: "Annual",
      period: { unit: PeriodUnit.Year, number: 1 },
      basePriceMicros: 60_000_000,
      currency: "USD",
    },
    {
      packageIdentifier: "premium_monthly",
      identifier: "premium_monthly",
      title: "Premium Monthly",
      period: { unit: PeriodUnit.Month, number: 1 },
      basePriceMicros: 100_000_000,
      currency: "USD",
    },
  ]);

  test("measures each package against every price that can be its tab's most expensive", () => {
    const result = parseOfferingIntoPackageInfoPerPackage(offering, translator);

    const savings = (relative: string, absolute: string) => ({
      "product.absolute_discount": absolute,
      "product.relative_discount_with_offer": relative,
      "product.absolute_discount_with_offer": absolute,
      "product.relative_discount_with_offer_full_period": relative,
      "product.absolute_discount_with_offer_full_period": absolute,
    });
    expect(
      result.$rc_annual?.discountVariablesByMostExpensivePricePerMonth,
    ).toEqual({
      "5000000": savings("", ""),
      "10000000": savings("50%", "$60.00"),
      "100000000": savings("95%", "$1,140.00"),
    });
    expect(
      result.$rc_monthly?.discountVariablesByMostExpensivePricePerMonth,
    ).toEqual({
      "10000000": savings("", ""),
      "100000000": savings("90%", "$90.00"),
    });
    expect(
      result.premium_monthly?.discountVariablesByMostExpensivePricePerMonth,
    ).toEqual({ "100000000": savings("", "") });
  });

  test("keys match the monthly prices ui-js compares", () => {
    const result = parseOfferingIntoPackageInfoPerPackage(offering, translator);

    for (const info of Object.values(result)) {
      expect(
        Object.keys(info.discountVariablesByMostExpensivePricePerMonth ?? {}),
      ).toContain(String(info.pricePerMonthMicros));
    }
  });

  test("is left out without a translator", () => {
    const result = parseOfferingIntoPackageInfoPerPackage(offering);

    expect(
      result.$rc_annual?.discountVariablesByMostExpensivePricePerMonth,
    ).toBeUndefined();
  });
});
