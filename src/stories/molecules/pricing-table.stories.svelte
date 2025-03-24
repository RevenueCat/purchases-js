<script module>
  import PricingTable from "../../ui/molecules/pricing-table.svelte";
  import {
    type Args,
    defineMeta,
    setTemplate,
  } from "@storybook/addon-svelte-csf";
  import { withNavbar } from "../decorators/with-navbar";
  import { brandingModes } from "../../../.storybook/modes";

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
    {...args}
    currency={args.currency ?? "USD"}
    total={args.total ?? 0}
    totalExcludingTax={args.totalExcludingTax ?? 0}
  />
{/snippet}

<Story
  name="No Tax"
  args={{
    currency: "USD",
    totalExcludingTax: 34.99,
    total: 34.99,
  }}
/>
<Story
  name="Pending Tax Generic"
  args={{
    currency: "USD",
    totalExcludingTax: 34.99,
    total: 34.99,
    taxItems: null,
  }}
/>
<Story
  name="Pending Tax US"
  args={{
    currency: "USD",
    totalExcludingTax: 34.99,
    total: 34.99,
    taxItems: null,
    calculationError: "needs_postal_code",
  }}
/>
<Story
  name="Pending Tax CA"
  args={{
    currency: "CAD",
    totalExcludingTax: 34.99,
    total: 34.99,
    taxItems: null,
    calculationError: "needs_state_or_postal_code",
  }}
/>
<Story
  name="Loading Tax"
  args={{
    currency: "USD",
    totalExcludingTax: 34.99,
    total: 34.99,
    taxItems: null,
    loadingTax: true,
  }}
/>
<Story
  name="Tax Inclusive"
  args={{
    currency: "EUR",
    totalExcludingTax: 28.93,
    taxItems: [
      {
        taxType: "IVA",
        taxAmountInMicros: 6060000,
        taxPercentageInMicros: 210000,
        country: "ES",
        state: null,
      },
    ],
    total: 34.99,
  }}
/>
<Story
  name="Tax Exclusive"
  args={{
    currency: "USD",
    totalExcludingTax: 34.99,
    taxItems: [
      {
        taxType: "VAT",
        taxAmountInMicros: 2450000,
        taxPercentageInMicros: 70000,
        country: "USA",
        state: "NY",
      },
    ],
    total: 37.44,
  }}
/>
<Story
  name="Multiple Tax Items"
  args={{
    currency: "CAD",
    totalExcludingTax: 34.99,
    taxItems: [
      {
        taxType: "GST",
        taxAmountInMicros: 1749500,
        taxPercentageInMicros: 50000,
        country: "CA",
        state: null,
      },
      {
        taxType: "QST",
        taxAmountInMicros: 3490250,
        taxPercentageInMicros: 99750,
        country: "CA",
        state: "ON",
      },
    ],
    trialEndDate: new Date("2025-03-20"),
    renewalTotal: 40.23,
    total: 0,
  }}
/>
<Story
  name="Trial"
  args={{
    currency: "USD",
    totalExcludingTax: 34.99,
    trialEndDate: new Date("2025-03-20"),
    renewalTotal: 34.99,
    total: 0,
  }}
/>
