<script module>
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import { withNavbar } from "../decorators/with-navbar";
  import PricingSummary from "../../ui/molecules/pricing-summary.svelte";
  import {
    product,
    subscriptionOption,
    subscriptionOptionWithTrial,
    nonSubscriptionOption,
    consumableProduct,
  } from "../fixtures";

  const { Story } = defineMeta({
    component: PricingSummary,
    title: "Molecules/PricingSummary",
    // @ts-expect-error ignore typing of decorator
    decorators: [withNavbar],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });
</script>

<Story
  name="Subscription"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOption,
  }}
/>

<Story
  name="Trial"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOptionWithTrial,
  }}
/>

<Story
  name="Non Subscription"
  args={{
    productDetails: consumableProduct,
    purchaseOption: nonSubscriptionOption,
  }}
/>

<Story
  name="With Price To Pay"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOption,
    priceToPay: {
      amountMicros:
        subscriptionOption.base?.price.amountMicros +
        subscriptionOption.base?.price.amountMicros * 0.08,
      currency: subscriptionOption.base?.price.currency,
    },
  }}
/>
