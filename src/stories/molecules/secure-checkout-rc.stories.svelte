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

<Story name="Without Extra Info">
  <SecureCheckoutRC brandingInfo={null} purchaseOption={null} />
</Story>

<Story name="Non Subscription with branding info">
  <SecureCheckoutRC {brandingInfo} purchaseOption={nonSubscriptionOption} />
</Story>

<Story name="Subscription with branding info">
  <SecureCheckoutRC {brandingInfo} purchaseOption={subscriptionOption} />
</Story>

<Story name="Trial Subscription with branding info">
  <SecureCheckoutRC
    {brandingInfo}
    purchaseOption={subscriptionOptionWithTrial}
  />
</Story>

<Story name="Intro Price Paid Upfront with branding info">
  <SecureCheckoutRC
    {brandingInfo}
    purchaseOption={subscriptionOptionWithIntroPricePaidUpfront}
  />
</Story>

<Story name="Intro Price Recurring with branding info">
  <SecureCheckoutRC
    {brandingInfo}
    purchaseOption={subscriptionOptionWithIntroPriceRecurring}
  />
</Story>

<Story name="Trial + Intro Price Paid Upfront with branding info">
  <SecureCheckoutRC
    {brandingInfo}
    purchaseOption={subscriptionOptionWithTrialAndIntroPricePaidUpfront}
  />
</Story>

<Story name="Trial + Intro Price Recurring with branding info">
  <SecureCheckoutRC
    {brandingInfo}
    purchaseOption={subscriptionOptionWithTrialAndIntroPriceRecurring}
  />
</Story>
