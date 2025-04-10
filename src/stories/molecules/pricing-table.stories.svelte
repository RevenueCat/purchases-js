<script module>
  import PricingTable from "../../ui/molecules/pricing-table.svelte";
  import {
    type Args,
    defineMeta,
    setTemplate,
  } from "@storybook/addon-svelte-csf";
  import { withNavbar } from "../decorators/with-navbar";
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

  let { Story } = defineMeta({
    component: PricingTable,
    title: "Molecules/PricingTable",
    // @ts-expect-error ignore typing of decorator
    decorators: [withNavbar],
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
  name="Pending Tax Generic"
  args={{
    priceBreakdown: priceBreakdownTaxPending,
  }}
/>
<Story
  name="Pending Tax US"
  args={{
    priceBreakdown: {
      ...priceBreakdownTaxPending,
      pendingReason: "needs_postal_code",
    },
  }}
/>
<Story
  name="Pending Tax CA"
  args={{
    priceBreakdown: {
      ...priceBreakdownTaxPending,
      pendingReason: "needs_state_or_postal_code",
    },
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
