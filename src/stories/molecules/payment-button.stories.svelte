<script module>
  import PaymentButton from "../../ui/molecules/payment-button.svelte";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { withLayout } from "../decorators/with-layout";
  import { brandingModes } from "../../../.storybook/modes";
  import { subscriptionOption, subscriptionOptionWithTrial } from "../fixtures";

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

<Story
  name="With Subscription"
  args={{
    disabled: false,
    subscriptionOption: subscriptionOption,
  }}
/>

<Story
  name="With Subscription Disabled"
  args={{
    disabled: true,
    subscriptionOption: subscriptionOption,
  }}
/>

<Story
  name="With Trial"
  args={{
    disabled: false,
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
