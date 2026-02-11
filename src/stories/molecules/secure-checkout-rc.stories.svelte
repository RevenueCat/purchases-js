<script module lang="ts">
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import SecureCheckoutRC from "../../ui/molecules/secure-checkout-rc.svelte";
  import { brandingInfo } from "../fixtures";
  import {
    subscriptionOptionWithTrial,
    subscriptionOption,
    nonSubscriptionOption,
    subscriptionOptionWithIntroPricePaidUpfront,
    subscriptionOptionWithIntroPriceRecurring,
    subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    subscriptionOptionWithTrialAndIntroPriceRecurring,
    nonSubscriptionOptionWithDiscountPrice,
    subscriptionOptionWithDiscountPriceOneTime,
  } from "../fixtures";

  const { Story } = defineMeta({
    component: SecureCheckoutRC,
    title: "Molecules/SecureCheckoutRC",
    // @ts-expect-error ignore typing of decorator
    decorators: [renderInsideNavbarBody],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });
</script>

<Story
  name="Without Extra Info"
  args={{ brandingInfo: null, purchaseOption: null }}
/>

<Story
  name="Non Subscription with branding info"
  args={{ brandingInfo, purchaseOption: nonSubscriptionOption }}
/>

<Story
  name="Non Subscription + discount with branding info"
  args={{
    brandingInfo,
    purchaseOption: nonSubscriptionOptionWithDiscountPrice,
  }}
/>

<Story
  name="Subscription with branding info"
  args={{ brandingInfo, purchaseOption: subscriptionOption }}
/>

<Story
  name="Trial Subscription with branding info"
  args={{ brandingInfo, purchaseOption: subscriptionOptionWithTrial }}
/>

<Story
  name="Intro Price Paid Upfront with branding info"
  args={{
    brandingInfo,
    purchaseOption: subscriptionOptionWithIntroPricePaidUpfront,
  }}
/>

<Story
  name="Intro Price Recurring with branding info"
  args={{
    brandingInfo,
    purchaseOption: subscriptionOptionWithIntroPriceRecurring,
  }}
/>

<Story
  name="One-time discount with branding info"
  args={{
    brandingInfo,
    purchaseOption: subscriptionOptionWithDiscountPriceOneTime,
  }}
/>

<Story
  name="Trial + Intro Price Paid Upfront with branding info"
  args={{
    brandingInfo,
    purchaseOption: subscriptionOptionWithTrialAndIntroPricePaidUpfront,
  }}
/>

<Story
  name="Trial + Intro Price Recurring with branding info"
  args={{
    brandingInfo,
    purchaseOption: subscriptionOptionWithTrialAndIntroPriceRecurring,
  }}
/>
