<script module>
  import PaymentButton from "../../ui/molecules/payment-button.svelte";
  import {
    type Args,
    defineMeta,
    setTemplate,
  } from "@storybook/addon-svelte-csf";
  import { withLayout } from "../decorators/with-layout";
  import { brandingModes } from "../../../.storybook/modes";
  import {
    subscriptionOption,
    subscriptionOptionWithTrial,
    priceBreakdownTaxDisabled,
  } from "../fixtures";

  let { Story } = defineMeta({
    component: PaymentButton,
    title: "Molecules/PaymentButton",
    // @ts-expect-error ignore typing of decorator
    decorators: [withLayout],
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
  <PaymentButton
    disabled={args.disabled ?? false}
    subscriptionOption={args.subscriptionOption ?? subscriptionOption}
    priceBreakdown={args.priceBreakdown ?? priceBreakdownTaxDisabled}
    selectedPaymentMethod={args.selectedPaymentMethod ?? "card"}
  />
{/snippet}

<Story
  name="With Trial"
  args={{
    subscriptionOption: subscriptionOptionWithTrial,
  }}
/>

<Story
  name="With Trial Disabled"
  args={{
    disabled: true,
    subscriptionOption: subscriptionOptionWithTrial,
  }}
/>

<Story name="With Card" args={{}} />

<Story
  name="With Card Disabled"
  args={{
    disabled: true,
  }}
/>

<Story
  name="With Google Pay"
  args={{
    selectedPaymentMethod: "google_pay",
  }}
/>

<Story
  name="With Google Pay Disabled"
  args={{
    disabled: true,
    selectedPaymentMethod: "google_pay",
  }}
/>

<Story
  name="With Apple Pay"
  args={{
    selectedPaymentMethod: "apple_pay",
  }}
/>

<Story
  name="With Apple Pay Disabled"
  args={{
    disabled: true,
    selectedPaymentMethod: "apple_pay",
  }}
/>
