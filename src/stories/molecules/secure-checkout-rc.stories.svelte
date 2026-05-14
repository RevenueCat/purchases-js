<script module lang="ts">
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import type { SubscriptionOption } from "../../entities/offerings";
  import { PeriodUnit } from "../../helpers/duration-helper";
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
    nonSubscriptionOptionWithDiscount,
    subscriptionOptionWithDiscount,
    subscriptionOptionWithDiscountForever,
    subscriptionOptionWithDiscountOneTime,
  } from "../fixtures";

  const subscriptionOptionWithShortWindowDiscount = {
    ...subscriptionOption,
    id: "option_id_discount_short_window",
    priceId: "price_discount_short_window",
    discount: {
      timeWindow: "P1W",
      periodDuration: "P1W",
      durationMode: "time_window",
      price: subscriptionOptionWithDiscountOneTime.discount!.price,
      name: "Short Window Discount",
      period: {
        number: 1,
        unit: PeriodUnit.Week,
      },
      cycleCount: 1,
      discountType: "percentage",
      percentage: 20,
      fixedAmount: null,
    },
  } satisfies SubscriptionOption;

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
    purchaseOption: nonSubscriptionOptionWithDiscount,
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
    purchaseOption: subscriptionOptionWithDiscountOneTime,
  }}
/>

<Story
  name="Limited-time discount with branding info"
  args={{
    brandingInfo,
    purchaseOption: subscriptionOptionWithDiscount,
  }}
/>

<Story
  name="Forever discount with branding info"
  args={{
    brandingInfo,
    purchaseOption: subscriptionOptionWithDiscountForever,
  }}
/>

<Story
  name="One-cycle time-window discount with branding info"
  args={{
    brandingInfo,
    purchaseOption: subscriptionOptionWithShortWindowDiscount,
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
