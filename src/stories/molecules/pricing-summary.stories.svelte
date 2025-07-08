<script module>
  import { brandingModes } from "../../../.storybook/modes";
  import {
    type Args,
    defineMeta,
    setTemplate,
  } from "@storybook/addon-svelte-csf";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import PricingSummary from "../../ui/molecules/pricing-summary.svelte";
  import {
    subscriptionOption,
    subscriptionOptionWithTrial,
    subscriptionOptionWithIntroPricePaidUpfront,
    subscriptionOptionWithIntroPriceRecurring,
    subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    subscriptionOptionWithTrialAndIntroPriceRecurring,
    priceBreakdownTaxDisabled,
    priceBreakdownTaxDisabledIntroPriceRecurring,
    priceBreakdownTaxDisabledIntroPricePaidUpfront,
  } from "../fixtures";
  import { parseISODuration } from "../../helpers/duration-helper";

  const billingDurations = ["P1W", "P1M", "P3M", "P6M", "P1Y"];
  const introDurations = ["P1W", "P1M", "P3M", "P6M", "P1Y"];
  const trialDurations = ["P3D", "P1W", "P2W", "P1M"];

  const { Story } = defineMeta({
    component: PricingSummary,
    title: "Molecules/PricingSummary",
    decorators: [renderInsideNavbarBody],
    args: {
      billingDuration: subscriptionOption.base.periodDuration,
      hasIntroOffer: false,
      introDuration:
        subscriptionOptionWithIntroPriceRecurring.introPrice.periodDuration,
      introCycles:
        subscriptionOptionWithIntroPriceRecurring.introPrice.cycleCount,
      hasTrial: false,
      trialDuration: subscriptionOptionWithTrial.trial.periodDuration,
    },
    argTypes: {
      billingDuration: { control: "select", options: billingDurations },
      hasIntroOffer: { control: "boolean" },
      introDuration: { control: "select", options: introDurations },
      introCycles: {
        control: { type: "number", min: 1, max: 12, step: 1 },
      },
      hasTrial: { control: "boolean" },
      trialDuration: { control: "select", options: trialDurations },
    },
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });
</script>

<script lang="ts">
  setTemplate(template);
</script>

{#snippet template(args: Args<typeof Story>)}
  {@const basePhase = args.billingDuration
    ? {
        ...subscriptionOption.base,
        periodDuration: args.billingDuration,
        period: parseISODuration(args.billingDuration),
      }
    : null}

  {@const trialPhase = args.hasTrial
    ? {
        ...subscriptionOptionWithTrial.trial,
        periodDuration:
          args.trialDuration ??
          subscriptionOptionWithTrial.trial.periodDuration,
        period: parseISODuration(
          args.trialDuration ??
            subscriptionOptionWithTrial.trial.periodDuration,
        ),
      }
    : null}

  {@const introPricePhase = args.hasIntroOffer
    ? {
        ...(args.introCycles === 1
          ? subscriptionOptionWithIntroPricePaidUpfront.introPrice
          : subscriptionOptionWithIntroPriceRecurring.introPrice),
        periodDuration:
          args.introDuration ??
          (args.introCycles === 1
            ? subscriptionOptionWithIntroPricePaidUpfront.introPrice
                .periodDuration
            : subscriptionOptionWithIntroPriceRecurring.introPrice
                .periodDuration),
        period: parseISODuration(
          args.introDuration ??
            (args.introCycles === 1
              ? subscriptionOptionWithIntroPricePaidUpfront.introPrice
                  .periodDuration
              : subscriptionOptionWithIntroPriceRecurring.introPrice
                  .periodDuration),
        ),
        cycleCount:
          args.introCycles ??
          (args.introCycles === 1
            ? subscriptionOptionWithIntroPricePaidUpfront.introPrice.cycleCount
            : subscriptionOptionWithIntroPriceRecurring.introPrice.cycleCount),
      }
    : null}

  {@const priceBreakdown =
    args.priceBreakdown ??
    (args.hasIntroOffer
      ? args.introCycles > 1
        ? priceBreakdownTaxDisabledIntroPriceRecurring
        : priceBreakdownTaxDisabledIntroPricePaidUpfront
      : priceBreakdownTaxDisabled)}

  <PricingSummary {priceBreakdown} {basePhase} {trialPhase} {introPricePhase} />
{/snippet}

<Story
  name="Subscription"
  args={{
    priceBreakdown: priceBreakdownTaxDisabled,
    billingDuration: subscriptionOption.base.periodDuration,
    hasTrial: false,
    hasIntroOffer: false,
  }}
/>

<Story
  name="Trial"
  args={{
    priceBreakdown: priceBreakdownTaxDisabled,
    billingDuration: subscriptionOption.base.periodDuration,
    hasTrial: true,
    trialDuration: subscriptionOptionWithTrial.trial.periodDuration,
    hasIntroOffer: false,
  }}
/>

<Story
  name="Intro Price - Paid Upfront"
  args={{
    priceBreakdown: priceBreakdownTaxDisabledIntroPricePaidUpfront,
    billingDuration:
      subscriptionOptionWithIntroPricePaidUpfront.base.periodDuration,
    hasIntroOffer: true,
    introDuration:
      subscriptionOptionWithIntroPricePaidUpfront.introPrice.periodDuration,
    introCycles:
      subscriptionOptionWithIntroPricePaidUpfront.introPrice.cycleCount,
    hasTrial: false,
  }}
/>

<Story
  name="Intro Price - Recurring"
  args={{
    priceBreakdown: priceBreakdownTaxDisabledIntroPriceRecurring,
    billingDuration:
      subscriptionOptionWithIntroPriceRecurring.base.periodDuration,
    hasIntroOffer: true,
    introDuration:
      subscriptionOptionWithIntroPriceRecurring.introPrice.periodDuration,
    introCycles:
      subscriptionOptionWithIntroPriceRecurring.introPrice.cycleCount,
    hasTrial: false,
  }}
/>

<Story
  name="Trial + Intro Price - Paid Upfront"
  args={{
    priceBreakdown: priceBreakdownTaxDisabledIntroPricePaidUpfront,
    billingDuration:
      subscriptionOptionWithTrialAndIntroPricePaidUpfront.base.periodDuration,
    hasTrial: true,
    trialDuration:
      subscriptionOptionWithTrialAndIntroPricePaidUpfront.trial.periodDuration,
    hasIntroOffer: true,
    introDuration:
      subscriptionOptionWithTrialAndIntroPricePaidUpfront.introPrice
        .periodDuration,
    introCycles:
      subscriptionOptionWithTrialAndIntroPricePaidUpfront.introPrice.cycleCount,
  }}
/>

<Story
  name="Trial + Intro Price - Recurring"
  args={{
    priceBreakdown: priceBreakdownTaxDisabledIntroPriceRecurring,
    billingDuration:
      subscriptionOptionWithTrialAndIntroPriceRecurring.base.periodDuration,
    hasTrial: true,
    trialDuration:
      subscriptionOptionWithTrialAndIntroPriceRecurring.trial.periodDuration,
    hasIntroOffer: true,
    introDuration:
      subscriptionOptionWithTrialAndIntroPriceRecurring.introPrice
        .periodDuration,
    introCycles:
      subscriptionOptionWithTrialAndIntroPriceRecurring.introPrice.cycleCount,
  }}
/>

<Story
  name="Non Subscription"
  args={{
    priceBreakdown: priceBreakdownTaxDisabled,
    hasTrial: false,
    hasIntroOffer: false,
    billingDuration: null,
  }}
/>
