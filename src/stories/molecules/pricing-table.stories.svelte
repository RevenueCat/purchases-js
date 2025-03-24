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
    priceBreakdownTaxDisabled,
    priceBreakdownTaxExclusive,
    priceBreakdownTaxExclusiveWithMultipleTaxItems,
    priceBreakdownTaxInclusive,
    priceBreakdownTaxLoading,
    priceBreakdownTaxPending,
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
    trialEndDate={args.trialEndDate}
  />
{/snippet}

<Story name="Disabled Tax" />
<Story
  name="Disabled Tax Trial"
  args={{
    trialEndDate: new Date("2025-03-20"),
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
    trialEndDate: new Date("2025-03-20"),
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
    trialEndDate: new Date("2025-03-20"),
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
    trialEndDate: new Date("2025-03-20"),
  }}
/>
