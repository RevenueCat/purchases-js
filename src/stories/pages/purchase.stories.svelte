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
    brandingInfos,
    checkoutStartResponse,
    priceBreakdownTaxDisabled,
    priceBreakdownTaxInclusive,
    product,
    purchaseFlowError,
    subscriptionOption,
    subscriptionOptionWithTrial,
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
    argTypes: {
      withTaxes: {
        control: "boolean",
      },
      defaultUnmatchingTotalsError: {
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
  {@const brandingInfo = brandingInfos[context.globals.brandingName]}
  <PurchasesInner
    isSandbox={args.isSandbox}
    currentPage={args.currentPage}
    productDetails={args.productDetails}
    purchaseOptionToUse={args.purchaseOptionToUse}
    {brandingInfo}
    onContinue={() => {}}
    closeWithError={() => {}}
    customerEmail={args.customerEmail}
    lastError={null}
    gatewayParams={checkoutStartResponse.gateway_params}
    {purchaseOperationHelper}
    defaultPriceBreakdown={args.withTaxes
      ? priceBreakdownTaxInclusive
      : priceBreakdownTaxDisabled}
    defaultUnmatchingTotalsError={args.defaultUnmatchingTotalsError}
    isInElement={context.globals.viewport === "embedded"}
    onError={() => {}}
  />
{/snippet}

<Story
  name="Checkout (with Sandbox Banner)"
  args={{ ...defaultArgs, currentPage: "payment-entry", isSandbox: true }}
/>

<Story
  name="Checkout"
  args={{ ...defaultArgs, currentPage: "payment-entry" }}
/>

<Story
  name="Checkout (with email input skipped)"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    isSandbox: true,
    customerEmail: "test@test.com",
  }}
/>

<Story
  name="Checkout (with Tax)"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    withTaxes: true,
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
/>

<Story
  name="Checkout (with unmatching totals error)"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    withTaxes: true,
    defaultUnmatchingTotalsError: true,
  }}
/>
<Story name="Loading" args={{ currentPage: "payment-entry-loading" }} />
<Story name="Payment complete" args={{ currentPage: "success" }} />
<Story name="Payment failed" args={{ currentPage: "error" }} />
