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
    priceBreakdownTaxDisabled,
  } from "../fixtures";
  import { PurchaseOperationHelper } from "../../helpers/purchase-operation-helper";

  const defaultArgs = {
    productDetails: product,
    purchaseOptionToUse: subscriptionOption,
    purchaseOption: subscriptionOption,
    lastError: purchaseFlowError,
    onContinue: () => {},
  };

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
    currentPage={args.currentPage}
    productDetails={args.productDetails}
    purchaseOptionToUse={args.purchaseOptionToUse}
    {brandingInfo}
    handleContinue={() => {}}
    closeWithError={() => {}}
    lastError={null}
    gatewayParams={checkoutStartResponse.gateway_params}
    priceBreakdown={priceBreakdownTaxDisabled}
    purchaseOperationHelper={null as unknown as PurchaseOperationHelper}
    isInElement={context.globals.viewport === "embedded"}
  />
{/snippet}

<Story name="Email Input" args={{ currentPage: "email-entry" }} />
<Story
  name="Email Input (with Sandbox Banner)"
  args={{ currentPage: "email-entry", isSandbox: true }}
/>

<Story
  name="Email Input (with Trial Product)"
  args={{
    currentPage: "email-entry",
    isSandbox: true,
    productDetails: {
      ...product,
      normalPeriodDuration: "P1Y",
    },
    purchaseOptionToUse: subscriptionOptionWithTrial,
  }}
/>
<Story name="Checkout" args={{ currentPage: "payment-entry" }} />
<Story
  name="Checkout (with Trial Product)"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
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
<Story name="Loading" args={{ currentPage: "payment-entry-loading" }} />
<Story name="Payment complete" args={{ currentPage: "success" }} />
<Story name="Payment failed" args={{ currentPage: "error" }} />
