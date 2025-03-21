<script module>
  import {
    defineMeta,
    setTemplate,
    type StoryContext,
    type Args,
  } from "@storybook/addon-svelte-csf";
  import PurchasesInner from "../../ui/purchases-ui-inner.svelte";
  import { brandingLanguageViewportModes } from "../../../.storybook/modes";

  import {
    brandingInfos,
    product,
    purchaseFlowError,
    subscriptionOption,
    subscriptionOptionWithTrial,
    checkoutStartResponse,
  } from "../fixtures";
  import { PurchaseOperationHelper } from "../../helpers/purchase-operation-helper";

  const defaultArgs = {
    productDetails: product,
    purchaseOptionToUse: subscriptionOption,
    purchaseOption: subscriptionOption,
    lastError: purchaseFlowError,
    onContinue: () => {},
  };

  let paymentInfoCollectionMetadata: any;

  let { Story } = defineMeta({
    title: "Pages/Purchase",
    args: defaultArgs,
    parameters: {
      viewport: {
        defaultViewport: "mobile",
      },
      chromatic: {
        modes: brandingLanguageViewportModes,
        diffThreshold: 0.49,
      },
    },
    loaders: [
      async () => {
        paymentInfoCollectionMetadata = { ...checkoutStartResponse };
        return { paymentInfoCollectionMetadata };
      },
    ],
  });
</script>

<script lang="ts">
  setTemplate(template);
</script>

{#snippet template(
  args: Args<typeof Story>,
  context: StoryContext<typeof Story>,
)}
  {@const brandingInfo = brandingInfos[context.globals.brandingName]}
  <PurchasesInner
    isSandbox={args.isSandbox}
    currentView={args.currentView}
    productDetails={args.productDetails}
    purchaseOptionToUse={args.purchaseOptionToUse}
    {brandingInfo}
    handleContinue={() => {}}
    closeWithError={() => {}}
    lastError={null}
    {paymentInfoCollectionMetadata}
    purchaseOperationHelper={null as unknown as PurchaseOperationHelper}
    isInElement={context.globals.viewport === "embedded"}
  />
{/snippet}

<Story name="Email Input" args={{ currentView: "needs-auth-info" }} />
<Story
  name="Email Input (with Sandbox Banner)"
  args={{ currentView: "needs-auth-info", isSandbox: true }}
/>

<Story
  name="Email Input (with Trial Product)"
  args={{
    currentView: "needs-auth-info",
    isSandbox: true,
    productDetails: {
      ...product,
      normalPeriodDuration: "P1Y",
    },
    purchaseOptionToUse: subscriptionOptionWithTrial,
  }}
/>
<Story name="Checkout" args={{ currentView: "needs-payment-info" }} />
<Story
  name="Checkout (with Trial Product)"
  args={{
    ...defaultArgs,
    currentView: "needs-payment-info",
    productDetails: {
      ...product,
      subscriptionOptions: {
        ...product.subscriptionOptions,
        [subscriptionOptionWithTrial.id]: subscriptionOptionWithTrial,
      },
    },
    purchaseOptionToUse: subscriptionOptionWithTrial,
    defaultPurchaseOption: subscriptionOptionWithTrial,
  }}
/>
<Story name="Loading" args={{ currentView: "loading" }} />
<Story name="Payment complete" args={{ currentView: "success" }} />
<Story name="Payment failed" args={{ currentView: "error" }} />
