<script module lang="ts">
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import { expect, userEvent, within } from "@storybook/test";
  import UpgradeCheckoutUi from "../../ui/upgrade-checkout-ui.svelte";
  import { brandingLanguageViewportModes } from "../../../.storybook/modes";
  import {
    brandingInfos,
    rcPackage,
    subscriptionChangeDeferredTaxPending,
    subscriptionChangeDeferredWithTax,
    subscriptionChangeImmediateMinimal,
    subscriptionChangeImmediateTaxPending,
    subscriptionChangeImmediateWithTax,
  } from "../fixtures";
  import { createMockProductChangeOperationHelper } from "../helpers/mock-product-change-operation-helper";
  import type { SubscriptionChangeCheckoutStartResponse } from "../../networking/responses/subscription-change-response";

  type StoryArgs = {
    startData?: SubscriptionChangeCheckoutStartResponse;
    startErrorMessage?: string;
    startPending?: boolean;
    confirmPending?: boolean;
    isSandbox?: boolean;
  };

  let { Story } = defineMeta({
    component: UpgradeCheckoutUi,
    title: "Pages/UpgradeCheckoutUi",
    parameters: {
      viewport: {
        defaultViewport: "mobile",
      },
      chromatic: {
        modes: brandingLanguageViewportModes,
        delay: 300,
      },
    },
    // @ts-expect-error ignore importing before initializing
    render: template,
  });

  function mockForArgs(
    args: StoryArgs,
  ): ReturnType<typeof createMockProductChangeOperationHelper> {
    if (args.startPending) {
      return createMockProductChangeOperationHelper({
        start: { type: "pending" },
      });
    }
    if (args.startErrorMessage) {
      return createMockProductChangeOperationHelper({
        start: { type: "error", message: args.startErrorMessage },
      });
    }
    return createMockProductChangeOperationHelper({
      start: {
        type: "success",
        data: args.startData ?? subscriptionChangeImmediateWithTax,
      },
      confirm: args.confirmPending ? { type: "pending" } : undefined,
    });
  }
</script>

{#snippet template(
  args: StoryArgs,
  context: StoryContext<typeof UpgradeCheckoutUi>,
)}
  {@const brandingInfo = { ...brandingInfos[context.globals.brandingName] }}
  {@const mock = mockForArgs(args)}
  <UpgradeCheckoutUi
    subscriberToken="subscriber_token_story"
    {rcPackage}
    purchaseOption={rcPackage.webBillingProduct.defaultPurchaseOption}
    {brandingInfo}
    isInElement={context.globals.viewport === "embedded"}
    isSandbox={args.isSandbox ?? false}
    productChangeOperationHelper={mock.helper}
    startCheckout={mock.startCheckout}
    onFallthrough={() => {}}
    initialStartData={args.startData}
    onFinished={() => {}}
    onError={() => {}}
    onClose={() => {}}
  />
{/snippet}

<Story
  name="Loading"
  args={{ startPending: true }}
  parameters={{
    chromatic: {
      // Stay on the loading state; no need to wait for a resolved start call.
      delay: 0,
    },
  }}
/>

<Story
  name="Load Error"
  args={{
    startErrorMessage: "Failed to load upgrade checkout.",
  }}
/>

<Story
  name="Immediate With Tax"
  args={{ startData: subscriptionChangeImmediateWithTax }}
/>

<Story
  name="Immediate Tax Calculated Later"
  args={{ startData: subscriptionChangeImmediateTaxPending }}
/>

<Story
  name="Immediate Minimal"
  args={{ startData: subscriptionChangeImmediateMinimal }}
/>

<Story
  name="Deferred With Tax"
  args={{ startData: subscriptionChangeDeferredWithTax }}
/>

<Story
  name="Deferred Tax Calculated Later"
  args={{ startData: subscriptionChangeDeferredTaxPending }}
/>

<Story
  name="Sandbox"
  args={{
    startData: subscriptionChangeImmediateWithTax,
    isSandbox: true,
  }}
/>

<Story
  name="Confirming"
  args={{
    startData: subscriptionChangeImmediateWithTax,
    confirmPending: true,
  }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = await canvas.findByRole("button", { name: "Pay now" });
    await userEvent.click(button);
    await expect(
      await canvas.findByRole("button", { name: "Confirming…" }),
    ).toBeDisabled();
  }}
/>
