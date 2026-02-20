<script module lang="ts">
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
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
  } from "../fixtures";
  import type { ComponentProps } from "svelte";

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
    // @ts-expect-error ignore importing before initializing
    render: template,
  });
  type Args = ComponentProps<typeof SecureCheckoutRC>;
  type Context = StoryContext<typeof SecureCheckoutRC>;
</script>

{#snippet template(args: Args, _context: Context)}
  <SecureCheckoutRC
    brandingInfo={args.brandingInfo}
    purchaseOption={args.purchaseOption}
  />
{/snippet}

<Story
  name="Without Extra Info"
  args={{ brandingInfo: null, purchaseOption: null }}
/>

<Story
  name="Non Subscription with branding info"
  args={{ brandingInfo, purchaseOption: nonSubscriptionOption }}
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
