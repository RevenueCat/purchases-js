<script module lang="ts">
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import PurchasesInner from "../../ui/purchases-ui-inner.svelte";
  import { brandingLanguageViewportModes } from "../../../.storybook/modes";
  import {
    brandingInfos,
    product,
    subscriptionOption,
    subscriptionChangeDeferredTaxPending,
    subscriptionChangeDeferredWithTax,
    subscriptionChangeImmediateLongNames,
    subscriptionChangeImmediateMinimal,
    subscriptionChangeImmediateTaxPending,
    subscriptionChangeImmediateWithTax,
  } from "../fixtures";
  import { PurchaseOperationHelper } from "../../helpers/purchase-operation-helper";
  import type { SubscriptionChangeCheckoutStartResponse } from "../../networking/responses/subscription-change-response";

  type StoryArgs = {
    startData: SubscriptionChangeCheckoutStartResponse;
    isConfirmingProductChange?: boolean;
    productChangeConfirmError?: string | null;
    isSandbox?: boolean;
  };

  let { Story } = defineMeta({
    component: PurchasesInner,
    title: "Pages/UpgradeConfirmPage",
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

  let purchaseOperationHelper = null as unknown as PurchaseOperationHelper;
</script>

{#snippet template(
  args: StoryArgs,
  context: StoryContext<typeof PurchasesInner>,
)}
  {@const brandingInfo = { ...brandingInfos[context.globals.brandingName] }}
  <PurchasesInner
    isSandbox={args.isSandbox ?? false}
    currentPage="upgrade-confirm"
    {brandingInfo}
    productDetails={product}
    purchaseOptionToUse={subscriptionOption}
    lastError={null}
    gatewayParams={{}}
    managementUrl={null}
    {purchaseOperationHelper}
    isInElement={context.globals.viewport === "embedded"}
    forceEnableWalletMethods={false}
    customerEmail={null}
    subscriptionChangeStartData={args.startData}
    isConfirmingProductChange={args.isConfirmingProductChange ?? false}
    productChangeConfirmError={args.productChangeConfirmError ?? null}
    onConfirmProductChange={() => {}}
    closeWithError={() => {}}
    onContinue={() => {}}
    onError={() => {}}
    onClose={() => {}}
  />
{/snippet}

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
    isConfirmingProductChange: true,
  }}
/>

<Story
  name="Confirm Error"
  args={{
    startData: subscriptionChangeImmediateWithTax,
    productChangeConfirmError: "Failed to confirm product change.",
  }}
/>

<Story
  name="Long Product Names"
  args={{ startData: subscriptionChangeImmediateLongNames }}
/>
