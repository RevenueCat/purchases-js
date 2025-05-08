<script module lang="ts">
  import {
    type Args,
    defineMeta,
    setTemplate,
    type StoryContext,
  } from "@storybook/addon-svelte-csf";
  import PurchasesInner from "../../ui/purchases-ui-inner.svelte";
  import { brandingLanguageViewportModes } from "../../../.storybook/modes";
  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
  } from "../../helpers/purchase-operation-helper";
  import {
    brandingInfos,
    checkoutStartResponse,
    priceBreakdownTaxDisabled,
    priceBreakdownTaxInclusive,
    product,
    purchaseFlowError,
    subscriptionOption,
    subscriptionOptionWithTrial,
    consumableProduct,
  } from "../fixtures";

  const purchaseFlowAlreadyPurchasedError = new PurchaseFlowError(
    PurchaseFlowErrorCode.AlreadyPurchasedError,
  );

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
    argTypes: {
      withTaxes: {
        control: "boolean",
      },
    },
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
  let purchaseOperationHelper = null as unknown as PurchaseOperationHelper;
</script>

<script lang="ts">
  setTemplate(template);
</script>

{#snippet template(
  args: Args<typeof Story>,
  context: StoryContext<typeof Story>,
)}
  {@const brandingInfo = {
    ...brandingInfos[context.globals.brandingName],
    gateway_tax_collection_enabled: args.withTaxes ?? false,
  }}
  <PurchasesInner
    isSandbox={args.isSandbox}
    currentPage={args.currentPage}
    productDetails={args.productDetails}
    purchaseOptionToUse={args.purchaseOptionToUse}
    {brandingInfo}
    onContinue={() => {}}
    closeWithError={() => {}}
    customerEmail={args.customerEmail}
    lastError={args.lastError}
    gatewayParams={checkoutStartResponse.gateway_params}
    {purchaseOperationHelper}
    defaultPriceBreakdown={args.defaultPriceBreakdown ??
      (args.withTaxes ? priceBreakdownTaxInclusive : priceBreakdownTaxDisabled)}
    isInElement={context.globals.viewport === "embedded"}
    onError={() => {}}
    onClose={() => {}}
  />
{/snippet}

<Story
  name="Checkout"
  args={{ ...defaultArgs, currentPage: "payment-entry" }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>

<Story
  name="Checkout (with Sandbox Banner)"
  args={{ ...defaultArgs, currentPage: "payment-entry", isSandbox: true }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>

<Story
  name="Checkout (with email input skipped)"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    isSandbox: true,
    customerEmail: "test@test.com",
  }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>

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
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>

<Story
  name="Checkout (with Tax)"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    withTaxes: true,
  }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>

<Story
  name="Checkout (with Tax and Trial Product)"
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
    withTaxes: true,
  }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>

<Story
  name="Checkout (with Tax miss-match)"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    withTaxes: true,
    defaultPriceBreakdown: {
      ...priceBreakdownTaxInclusive,
      taxCalculationStatus: "miss-match",
    },
  }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>

<Story name="Loading" args={{ currentPage: "payment-entry-loading" }} />
<Story name="Payment complete" args={{ currentPage: "success" }} />
<Story name="Payment failed" args={{ currentPage: "error" }} />
<Story
  name="Already subscribed"
  args={{
    currentPage: "error",
    lastError: purchaseFlowAlreadyPurchasedError,
    productDetails: product,
  }}
/>
<Story
  name="Already purchased"
  args={{
    currentPage: "error",
    lastError: purchaseFlowAlreadyPurchasedError,
    productDetails: consumableProduct,
  }}
/>
