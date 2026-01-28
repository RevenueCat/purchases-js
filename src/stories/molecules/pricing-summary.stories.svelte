<script module lang="ts">
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import PricingSummary from "../../ui/molecules/pricing-summary.svelte";
  import {
    subscriptionOption,
    subscriptionOptionWithIntroPricePaidUpfront,
    subscriptionOptionWithIntroPriceRecurring,
    subscriptionOptionWithTrial,
    subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    subscriptionOptionWithTrialAndIntroPriceRecurring,
    subscriptionOptionWithSingleMonthIntroPriceRecurring,
    subscriptionOptionWithSingleWeekIntroPriceRecurring,
    subscriptionOptionWithSingleYearIntroPriceRecurring,
    subscriptionOptionWithMultipleMonthsIntroPriceRecurring,
    subscriptionOptionWithMultipleWeeksIntroPriceRecurring,
    subscriptionOptionWithMultipleYearsIntroPriceRecurring,
    subscriptionOptionWithSingleWeekWithTrialAndIntroPriceRecurring,
    subscriptionOptionWithDiscountPriceForever,
    subscriptionOptionWithDiscountPrice,
  } from "../fixtures";
  import { getPriceBreakdownTaxDisabled } from "../helpers/get-price-breakdown";

  import { parseISODuration } from "../../helpers/duration-helper";
  import type {
    PricingPhase,
    DiscountPricePhase,
  } from "../../entities/offerings";
  import type { PriceBreakdown } from "../../ui/ui-types";

  const billingDurations = ["P1W", "P1M", "P3M", "P6M", "P1Y", null];
  const introDurations = ["P1W", "P1M", "P3M", "P6M", "P1Y", null];
  const trialDurations = ["P3D", "P1W", "P2W", "P1M", null];

  type StoryArgs = {
    priceBreakdown: PriceBreakdown;
    basePhase?: PricingPhase | null;
    introPricePhase?: PricingPhase | null;
    discountPricePhase?: DiscountPricePhase | null;
    trialPhase?: PricingPhase | null;
    billingDuration?: string | null;
    introDuration?: string | null;
    discountDuration?: string | null;
    introCycles?: number | null;
    trialDuration?: string | null;
  };

  const { Story } = defineMeta({
    component: PricingSummary,
    title: "Molecules/PricingSummary",
    // @ts-expect-error ignore typing of decorator
    decorators: [renderInsideNavbarBody],
    // The args of this story define custom controls to make it easier to use it.
    // I didn't find a way to define the custom controls for the child attributes.
    args: {
      billingDuration: null,
      introDuration: null,
      discountDuration: null,
      introCycles: null,
      trialDuration: null,
      discountPriceDuration: null,
    } as any,
    argTypes: {
      billingDuration: { control: "select", options: billingDurations },
      introDuration: { control: "select", options: introDurations },
      introCycles: {
        control: { type: "number", min: 1, max: 12, step: 1 },
      },
      trialDuration: { control: "select", options: trialDurations },
    } as any,
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
    // @ts-expect-error ignore importing before initializing
    render: template,
  });

  const setPeriodDuration = (
    periodDuration: string | null | undefined,
    pricingPhase: PricingPhase | null | undefined,
    defaultP: PricingPhase,
  ) => {
    if (!periodDuration) {
      return pricingPhase || defaultP;
    }
    if (!pricingPhase) {
      return {
        ...defaultP,
        period: parseISODuration(periodDuration),
        periodDuration: periodDuration,
      };
    }
    return {
      ...pricingPhase,
      period: parseISODuration(periodDuration) || pricingPhase.periodDuration,
      periodDuration: periodDuration,
    } as PricingPhase;
  };
  const setCyclesCount = (
    cyclesCount: number | null | undefined,
    pricingPhase: PricingPhase,
  ) => {
    if (!cyclesCount) {
      return pricingPhase;
    }
    return {
      ...pricingPhase,
      cycleCount: cyclesCount || pricingPhase.cycleCount,
    } as PricingPhase;
  };
  const defaultBasePhase: PricingPhase =
    subscriptionOption.base as PricingPhase;
  const defaultTrialPhase: PricingPhase =
    subscriptionOption.trial as PricingPhase;
  const defaultIntroPricePhase: PricingPhase =
    subscriptionOptionWithIntroPriceRecurring.introPrice as PricingPhase;
</script>

{#snippet template(
  args: StoryArgs,
  _context: StoryContext<typeof PricingSummary>,
)}
  {@const priceBreakdown = args.priceBreakdown}
  {@const basePhase = args.basePhase
    ? setPeriodDuration(args.billingDuration, args.basePhase, defaultBasePhase)
    : null}
  {@const trialPhase = args.trialPhase
    ? setPeriodDuration(args.trialDuration, args.trialPhase, defaultTrialPhase)
    : null}
  {@const introPricePhase = args.introPricePhase
    ? setCyclesCount(
        args.introCycles,
        setPeriodDuration(
          args.introDuration,
          args.introPricePhase,
          defaultIntroPricePhase,
        ),
      )
    : null}
  {@const discountPricePhase = args.discountPricePhase ?? null}

  <PricingSummary
    {priceBreakdown}
    {basePhase}
    {trialPhase}
    {introPricePhase}
    {discountPricePhase}
  />
{/snippet}

<Story
  name="Subscription"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(subscriptionOption),
    basePhase: subscriptionOption.base,
  }}
/>

<Story
  name="Subscription with Forever Discount"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithDiscountPriceForever,
    ),
    basePhase: subscriptionOption.base,
    discountPricePhase:
      subscriptionOptionWithDiscountPriceForever.discountPrice,
  }}
/>

<Story
  name="Subscription with Time Window Discount"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithDiscountPrice,
    ),
    basePhase: subscriptionOption.base,
    discountPricePhase: subscriptionOptionWithDiscountPrice.discountPrice,
  }}
/>

<Story
  name="Trial"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(subscriptionOptionWithTrial),
    basePhase: subscriptionOption.base,
    trialPhase: subscriptionOptionWithTrial.trial,
  }}
/>

<Story
  name="Intro Price - Paid Upfront"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithIntroPricePaidUpfront,
    ),
    basePhase: subscriptionOptionWithIntroPricePaidUpfront.base,
    introPricePhase: subscriptionOptionWithIntroPricePaidUpfront.introPrice,
  }}
/>

<Story
  name="Intro Price - Recurring"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithIntroPriceRecurring,
    ),
    basePhase: subscriptionOptionWithIntroPriceRecurring.base,
    introPricePhase: subscriptionOptionWithIntroPriceRecurring.introPrice,
  }}
/>

<Story
  name="Trial + Intro Price - Paid Upfront"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    ),
    basePhase: subscriptionOptionWithTrialAndIntroPricePaidUpfront.base,
    trialPhase: subscriptionOptionWithTrialAndIntroPricePaidUpfront.trial,
    introPricePhase:
      subscriptionOptionWithTrialAndIntroPricePaidUpfront.introPrice,
  }}
/>

<Story
  name="Trial + Intro Price - Recurring"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithTrialAndIntroPriceRecurring,
    ),
    basePhase: subscriptionOptionWithTrialAndIntroPriceRecurring.base,
    trialPhase: subscriptionOptionWithTrialAndIntroPriceRecurring.trial,
    introPricePhase:
      subscriptionOptionWithTrialAndIntroPriceRecurring.introPrice,
  }}
/>

<Story
  name="Intro Price - Single Week"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithSingleWeekIntroPriceRecurring,
    ),
    basePhase: subscriptionOptionWithSingleWeekIntroPriceRecurring.base,
    introPricePhase:
      subscriptionOptionWithSingleWeekIntroPriceRecurring.introPrice,
  }}
/>

<Story
  name="Intro Price - Multiple Weeks"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithMultipleWeeksIntroPriceRecurring,
    ),
    basePhase: subscriptionOptionWithMultipleWeeksIntroPriceRecurring.base,
    introPricePhase:
      subscriptionOptionWithMultipleWeeksIntroPriceRecurring.introPrice,
  }}
/>

<Story
  name="Intro Price - Single Month"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithSingleMonthIntroPriceRecurring,
    ),
    basePhase: subscriptionOptionWithSingleMonthIntroPriceRecurring.base,
    introPricePhase:
      subscriptionOptionWithSingleMonthIntroPriceRecurring.introPrice,
  }}
/>

<Story
  name="Intro Price - Multiple Months"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithMultipleMonthsIntroPriceRecurring,
    ),
    basePhase: subscriptionOptionWithMultipleMonthsIntroPriceRecurring.base,
    introPricePhase:
      subscriptionOptionWithMultipleMonthsIntroPriceRecurring.introPrice,
  }}
/>

<Story
  name="Intro Price - Single Year"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithSingleYearIntroPriceRecurring,
    ),
    basePhase: subscriptionOptionWithSingleYearIntroPriceRecurring.base,
    introPricePhase:
      subscriptionOptionWithSingleYearIntroPriceRecurring.introPrice,
  }}
/>

<Story
  name="Intro Price - Multiple Years"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithMultipleYearsIntroPriceRecurring,
    ),
    basePhase: subscriptionOptionWithMultipleYearsIntroPriceRecurring.base,
    introPricePhase:
      subscriptionOptionWithMultipleYearsIntroPriceRecurring.introPrice,
  }}
/>

<Story
  name="Intro Price - Single Week with Trial"
  args={{
    priceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithSingleWeekWithTrialAndIntroPriceRecurring,
    ),
    basePhase:
      subscriptionOptionWithSingleWeekWithTrialAndIntroPriceRecurring.base,
    trialPhase:
      subscriptionOptionWithSingleWeekWithTrialAndIntroPriceRecurring.trial,
    introPricePhase:
      subscriptionOptionWithSingleWeekWithTrialAndIntroPriceRecurring.introPrice,
  }}
/>
