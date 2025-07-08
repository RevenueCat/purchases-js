<script module lang="ts">
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
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

  const billingDurations = ["P1W", "P1M", "P3M", "P6M", "P1Y", null];
  const introDurations = ["P1W", "P1M", "P3M", "P6M", "P1Y", null];
  const trialDurations = ["P3D", "P1W", "P2W", "P1M", null];

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
  });

  const setPeriodDuration = (
    periodDuration: string,
    pricingPhase: PricingPhase,
    defaultP: PricingPhase,
  ) => {
    if (!periodDuration) {
      return pricingPhase;
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
  const setCyclesCount = (cyclesCount: number, pricingPhase: PricingPhase) => {
    if (!cyclesCount) {
      return pricingPhase;
    }
    return {
      ...pricingPhase,
      cycleCount: cyclesCount || pricingPhase.cycleCount,
    } as PricingPhase;
  };
</script>

<script lang="ts">
  // Using a template to translate the custom controls into props.
  setTemplate(template);
</script>

{#snippet template(args: any)}
  {@const priceBreakdown = args.priceBreakdown}
  {@const basePhase = setPeriodDuration(
    args.billingDuration,
    args.basePhase,
    subscriptionOption.base,
  )}
  {@const trialPhase = setPeriodDuration(
    args.trialDuration,
    args.trialPhase,
    subscriptionOptionWithTrial.trial!,
  )}
  {@const introPricePhase = setCyclesCount(
    args.introCycles,
    setPeriodDuration(
      args.introDuration,
      args.trialPhase,
      subscriptionOptionWithIntroPriceRecurring.introPrice!,
    ),
  )}

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
