<script module lang="ts">
  import SimulatedStoreModal from "../../ui/molecules/simulated-store-modal.svelte";
  import { renderInsideMain } from "../decorators/layout-decorators";
  import { brandingModes } from "../../../.storybook/modes";
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import type { ComponentProps } from "svelte";

  let { Story } = defineMeta({
    component: SimulatedStoreModal,
    title: "Molecules/SimulatedStoreModal",
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
  type Args = ComponentProps<typeof SimulatedStoreModal>;
  type Context = StoryContext<typeof SimulatedStoreModal>;

  // Mock callback functions for the stories
  const mockValidPurchase = () => console.log("Valid purchase clicked");
  const mockFailedPurchase = () => console.log("Failed purchase clicked");
  const mockCancel = () => console.log("Cancel clicked");
</script>

{#snippet template(args: Args, _context: Context)}
  <SimulatedStoreModal
    productIdentifier={args.productIdentifier ?? "test_product_123"}
    productType={args.productType ?? "subscription"}
    basePrice={args.basePrice ?? "$9.99"}
    freeTrialPeriod={args.freeTrialPeriod}
    introPriceFormatted={args.introPriceFormatted}
    onValidPurchase={args.onValidPurchase ?? mockValidPurchase}
    onFailedPurchase={args.onFailedPurchase ?? mockFailedPurchase}
    onCancel={args.onCancel ?? mockCancel}
  />
{/snippet}

<Story
  name="Subscription Product"
  args={{
    productIdentifier: "premium_subscription",
    productType: "subscription",
    basePrice: "$9.99/month",
  }}
/>

<Story
  name="Subscription with Free Trial"
  args={{
    productIdentifier: "premium_subscription_trial",
    productType: "subscription",
    basePrice: "$9.99/month",
    freeTrialPeriod: "7 days",
  }}
/>

<Story
  name="Subscription with Intro Price"
  args={{
    productIdentifier: "premium_subscription_intro",
    productType: "subscription",
    basePrice: "$9.99/month",
    introPriceFormatted: "$4.99/month",
  }}
/>

<Story
  name="Subscription with Trial and Intro Price"
  args={{
    productIdentifier: "premium_subscription_full",
    productType: "subscription",
    basePrice: "$9.99/month",
    freeTrialPeriod: "7 days",
    introPriceFormatted: "$4.99/month",
  }}
/>

<Story
  name="Consumable Product"
  args={{
    productIdentifier: "coin_pack_large",
    productType: "consumable",
    basePrice: "$4.99",
  }}
/>

<Story
  name="Non-Consumable Product"
  args={{
    productIdentifier: "remove_ads_forever",
    productType: "non_consumable",
    basePrice: "$2.99",
  }}
/>

<Story
  name="High Price Product"
  args={{
    productIdentifier: "enterprise_plan",
    productType: "subscription",
    basePrice: "$199.99/month",
    freeTrialPeriod: "30 days",
    introPriceFormatted: "$99.99/month",
  }}
/>

<Story
  name="Long Product Name"
  args={{
    productIdentifier:
      "very_long_product_identifier_that_might_wrap_in_the_modal_display",
    productType: "subscription",
    basePrice: "$9.99/month",
    freeTrialPeriod: "14 days",
  }}
/>
