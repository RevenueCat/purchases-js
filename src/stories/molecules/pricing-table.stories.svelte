<script module lang="ts">
  import PricingTable from "../../ui/molecules/pricing-table.svelte";
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import { brandingModes } from "../../../.storybook/modes";
  import {
    priceBreakdownNotCollectingTax,
    priceBreakdownTaxDisabled,
    priceBreakdownTaxExclusive,
    priceBreakdownTaxExclusiveWithMultipleTaxItems,
    priceBreakdownTaxInclusive,
    priceBreakdownTaxLoading,
    priceBreakdownTaxPending,
    subscriptionOptionWithTrial,
  } from "../fixtures";
  import type { ComponentProps } from "svelte";

  let { Story } = defineMeta({
    component: PricingTable,
    title: "Molecules/PricingTable",
    // @ts-expect-error ignore typing of decorator
    decorators: [renderInsideNavbarBody],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
    // @ts-expect-error ignore importing before initializing
    render: template,
  });
  type Args = ComponentProps<typeof PricingTable>;
  type Context = StoryContext<typeof PricingTable>;
</script>

{#snippet template(args: Args, _context: Context)}
  <PricingTable
    priceBreakdown={args.priceBreakdown ?? priceBreakdownTaxDisabled}
    trialPhase={args.trialPhase ?? null}
  />
{/snippet}

<Story name="Disabled Tax" />
<Story
  name="Disabled Tax Trial"
  args={{
    trialPhase: subscriptionOptionWithTrial.trial,
  }}
/>
<Story
  name="Not collecting tax"
  args={{ priceBreakdown: priceBreakdownNotCollectingTax }}
/>
<Story
  name="Not collecting tax Trial"
  args={{
    priceBreakdown: priceBreakdownNotCollectingTax,
    trialPhase: subscriptionOptionWithTrial.trial,
  }}
/>
<Story
  name="Pending Tax"
  args={{
    priceBreakdown: priceBreakdownTaxPending,
  }}
/>
<Story
  name="Loading Tax"
  args={{
    priceBreakdown: priceBreakdownTaxLoading,
  }}
/>
<Story
  name="Tax Inclusive"
  args={{
    priceBreakdown: priceBreakdownTaxInclusive,
  }}
/>
<Story
  name="Tax Inclusive Trial"
  args={{
    priceBreakdown: priceBreakdownTaxInclusive,
    trialPhase: subscriptionOptionWithTrial.trial,
  }}
/>
<Story
  name="Tax Exclusive"
  args={{
    priceBreakdown: priceBreakdownTaxExclusive,
  }}
/>
<Story
  name="Tax Exclusive Trial"
  args={{
    priceBreakdown: priceBreakdownTaxExclusive,
    trialPhase: subscriptionOptionWithTrial.trial,
  }}
/>
<Story
  name="Multiple Tax Items (Exclusive)"
  args={{
    priceBreakdown: priceBreakdownTaxExclusiveWithMultipleTaxItems,
  }}
/>
<Story
  name="Multiple Tax Items Trial (Exclusive)"
  args={{
    priceBreakdown: priceBreakdownTaxExclusiveWithMultipleTaxItems,
    trialPhase: subscriptionOptionWithTrial.trial,
  }}
/>
