import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { writable } from "svelte/store";
import type { ComponentProps } from "svelte";
import PricingTable from "../../../ui/molecules/pricing-table.svelte";
import { Translator } from "../../../ui/localization/translator";
import { translatorContextKey } from "../../../ui/localization/constants";
import {
  subscriptionOption,
  subscriptionOptionWithDiscount,
  subscriptionOptionWithMultipleWeeksIntroPriceRecurring,
  subscriptionOptionWithSingleWeekIntroPriceRecurring,
  subscriptionOptionWithSingleWeekWithTrialAndIntroPriceRecurring,
  subscriptionOptionWithTrial,
} from "../../../stories/fixtures";
import { getPriceBreakdownTaxDisabled } from "../../../stories/helpers/get-price-breakdown";
import type { SubscriptionOption } from "../../../entities/offerings";

const context = new Map(
  Object.entries({
    [translatorContextKey]: writable(new Translator()),
  }),
);

const renderTable = (option: SubscriptionOption) => {
  const props: ComponentProps<PricingTable> = {
    priceBreakdown: getPriceBreakdownTaxDisabled(option),
    trialPhase: option.trial,
    basePhase: option.base,
    introPricePhase: option.introPrice,
    discountPhase: option.discount,
    resolvedDiscount: null,
    showDiscountCodeField: false,
    discountCode: "",
    appliedDiscountCode: null,
    discountCodeError: null,
    isUpdatingDiscountCode: false,
    isDiscountCodeControlsEnabled: false,
    onDiscountCodeChange: undefined,
    onApplyDiscountCode: undefined,
    onRemoveDiscountCode: undefined,
  };

  return render(PricingTable, { props, context });
};

describe("PricingTable", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-08-07T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("after-intro-price row", () => {
    test("tells the customer when the intro price ends and what they pay then", () => {
      // 1-week intro at $1.49, base $9.90/month.
      renderTable(subscriptionOptionWithSingleWeekIntroPriceRecurring);

      expect(
        screen.getByText("After 1 week, on Aug 14, 2026"),
      ).toBeInTheDocument();
      // The base price, not today's $1.49 intro total.
      expect(screen.getByText("$9.90")).toBeInTheDocument();
    });

    test("counts every cycle of a multi-cycle intro phase", () => {
      renderTable(subscriptionOptionWithMultipleWeeksIntroPriceRecurring);

      expect(
        screen.getByText("After 2 weeks, on Aug 21, 2026"),
      ).toBeInTheDocument();
    });

    test("still charges only the intro price today", () => {
      renderTable(subscriptionOptionWithSingleWeekIntroPriceRecurring);

      expect(screen.getByText("Total due today")).toBeInTheDocument();
      expect(screen.getByText("$1.49")).toBeInTheDocument();
    });

    test("defers to the trial row when the option also has a free trial", () => {
      renderTable(
        subscriptionOptionWithSingleWeekWithTrialAndIntroPriceRecurring,
      );

      // Exactly one future-charge row, and it is the trial one.
      expect(screen.getAllByText(/^After /)).toHaveLength(1);
      expect(
        screen.getByText("After trial ends, on Aug 14, 2026"),
      ).toBeInTheDocument();
    });

    test("is not rendered when a discount supersedes the intro price", () => {
      // A discount replaces the intro price everywhere else too, so an intro
      // step-up row would describe a schedule that is not in effect.
      renderTable({
        ...subscriptionOptionWithSingleWeekIntroPriceRecurring,
        discount: subscriptionOptionWithDiscount.discount,
      });

      expect(screen.queryByText(/^After /)).not.toBeInTheDocument();
    });

    test("is not rendered for a plain subscription", () => {
      renderTable(subscriptionOption);

      expect(screen.queryByText(/^After /)).not.toBeInTheDocument();
    });

    test("leaves a trial-only subscription with just the trial row", () => {
      renderTable(subscriptionOptionWithTrial);

      expect(screen.getAllByText(/^After /)).toHaveLength(1);
      expect(
        screen.getByText("After trial ends, on Aug 14, 2026"),
      ).toBeInTheDocument();
    });
  });
});
