<script module lang="ts">
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import PricingSummary from "../../ui/molecules/pricing-summary.svelte";
  import {
    priceBreakdownTaxDisabled,
    priceBreakdownTaxDisabledIntroPricePaidUpfront,
    priceBreakdownTaxDisabledIntroPriceRecurring,
    subscriptionOption,
    subscriptionOptionWithIntroPricePaidUpfront,
    subscriptionOptionWithIntroPriceRecurring,
    subscriptionOptionWithTrial,
    subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    subscriptionOptionWithTrialAndIntroPriceRecurring,
  } from "../fixtures";

  import { parseISODuration } from "../../helpers/duration-helper";
  import type { PricingPhase } from "../../entities/offerings";
  import type { PriceBreakdown } from "../../ui/ui-types";

  const billingDurations = ["P1W", "P1M", "P3M", "P6M", "P1Y", null];
  const introDurations = ["P1W", "P1M", "P3M", "P6M", "P1Y", null];
  const trialDurations = ["P3D", "P1W", "P2W", "P1M", null];

  type StoryArgs = {
    priceBreakdown: PriceBreakdown;
    basePhase?: PricingPhase | null;
    introPricePhase?: PricingPhase | null;
    trialPhase?: PricingPhase | null;
    billingDuration?: string | null;
    introDuration?: string | null;
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
      introCycles: null,
      trialDuration: null,
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

  <PricingSummary {priceBreakdown} {basePhase} {trialPhase} {introPricePhase} />
{/snippet}

<Story
  name="Subscription"
  args={{
    priceBreakdown: priceBreakdownTaxDisabled,
    basePhase: subscriptionOption.base,
  }}
/>

<Story
  name="Trial"
  args={{
    priceBreakdown: priceBreakdownTaxDisabled,
    basePhase: subscriptionOption.base,
    trialPhase: subscriptionOptionWithTrial.trial,
  }}
/>

<Story
  name="Intro Price - Paid Upfront"
  args={{
    priceBreakdown: priceBreakdownTaxDisabledIntroPricePaidUpfront,
    basePhase: subscriptionOptionWithIntroPricePaidUpfront.base,
    introPricePhase: subscriptionOptionWithIntroPricePaidUpfront.introPrice,
  }}
/>

<Story
  name="Intro Price - Recurring"
  args={{
    priceBreakdown: priceBreakdownTaxDisabledIntroPriceRecurring,
    basePhase: subscriptionOptionWithIntroPriceRecurring.base,
    introPricePhase: subscriptionOptionWithIntroPriceRecurring.introPrice,
  }}
/>

<Story
  name="Trial + Intro Price - Paid Upfront"
  args={{
    priceBreakdown: priceBreakdownTaxDisabledIntroPricePaidUpfront,
    basePhase: subscriptionOptionWithTrialAndIntroPricePaidUpfront.base,
    trialPhase: subscriptionOptionWithTrialAndIntroPricePaidUpfront.trial,
    introPricePhase:
      subscriptionOptionWithTrialAndIntroPricePaidUpfront.introPrice,
  }}
/>

<Story
  name="Trial + Intro Price - Recurring"
  args={{
    priceBreakdown: priceBreakdownTaxDisabledIntroPriceRecurring,
    basePhase: subscriptionOptionWithTrialAndIntroPriceRecurring.base,
    trialPhase: subscriptionOptionWithTrialAndIntroPriceRecurring.trial,
    introPricePhase:
      subscriptionOptionWithTrialAndIntroPriceRecurring.introPrice,
  }}
/>

<Story
  name="Non Subscription"
  args={{
    priceBreakdown: priceBreakdownTaxDisabled,
  }}
/>
