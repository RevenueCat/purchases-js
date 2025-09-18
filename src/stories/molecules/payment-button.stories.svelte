<script module lang="ts">
  import PaymentButton from "../../ui/molecules/payment-button.svelte";
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import { renderInsideMain } from "../decorators/layout-decorators";
  import { brandingModes } from "../../../.storybook/modes";
  import {
    subscriptionOption,
    subscriptionOptionWithTrial,
    priceBreakdownTaxDisabled,
  } from "../fixtures";
  import type { ComponentProps } from "svelte";

  let { Story } = defineMeta({
    component: PaymentButton,
    title: "Molecules/PaymentButton",
    // @ts-expect-error ignore typing of decorator
    decorators: [renderInsideMain],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
    // @ts-expect-error ignore importing before initializing
    render: template,
  });
  type Args = ComponentProps<typeof PaymentButton>;
  type Context = StoryContext<typeof PaymentButton>;
</script>

{#snippet template(args: Args, _context: Context)}
  <PaymentButton
    disabled={args.disabled ?? false}
    subscriptionOption={args.subscriptionOption ?? subscriptionOption}
    priceBreakdown={args.priceBreakdown}
  />
{/snippet}

<Story
  name="With Trial"
  args={{
    subscriptionOption: subscriptionOptionWithTrial,
    priceBreakdown: priceBreakdownTaxDisabled,
  }}
/>

<Story
  name="With Trial Disabled"
  args={{
    disabled: true,
    subscriptionOption: subscriptionOptionWithTrial,
    priceBreakdown: priceBreakdownTaxDisabled,
  }}
/>

<Story
  name="Without price"
  args={{
    priceBreakdown: undefined,
  }}
/>

<Story
  name="Without price Disabled"
  args={{
    disabled: true,
    priceBreakdown: undefined,
  }}
/>

<Story
  name="With price"
  args={{
    priceBreakdown: priceBreakdownTaxDisabled,
  }}
/>

<Story
  name="With price Disabled"
  args={{
    disabled: true,
    priceBreakdown: priceBreakdownTaxDisabled,
  }}
/>
