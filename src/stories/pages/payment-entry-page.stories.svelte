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
    subscriptionOption,
    subscriptionOptionWithTrial,
    subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    priceBreakdownTaxDisabledIntroPricePaidUpfront,
    priceBreakdownTaxInclusiveWithIntroPricePaidUpfront,
  } from "../fixtures";
  import { PurchaseOperationHelper } from "../../helpers/purchase-operation-helper";

  const defaultArgs = {
    productDetails: product,
    purchaseOptionToUse: subscriptionOption,
    purchaseOption: subscriptionOption,
    onContinue: () => {},
  };

  let { Story } = defineMeta({
    title: "Pages/PaymentEntryPage",
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
  import { consumableProduct, nonSubscriptionOption } from "../fixtures";

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
    lastError={null}
    gatewayParams={checkoutStartResponse.gateway_params}
    {purchaseOperationHelper}
    defaultPriceBreakdown={args.defaultPriceBreakdown ??
      (args.withTaxes ? priceBreakdownTaxInclusive : priceBreakdownTaxDisabled)}
    isInElement={context.globals.viewport === "embedded"}
    onError={() => {}}
    onClose={() => {}}
    managementUrl="http://test.com"
  />
{/snippet}

<Story
  name="Default"
  args={{ ...defaultArgs, currentPage: "payment-entry" }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>

<Story
  name="With Sandbox Banner"
  args={{ ...defaultArgs, currentPage: "payment-entry", isSandbox: true }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>

<Story
  name="Without Email Input"
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
  name="With Trial Product"
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
  name="With Trial + Intro Price Paid Upfront"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    defaultPriceBreakdown: priceBreakdownTaxDisabledIntroPricePaidUpfront,
    productDetails: {
      ...product,
      subscriptionOptions: {
        ...product.subscriptionOptions,
        [subscriptionOptionWithTrialAndIntroPricePaidUpfront.id]:
          subscriptionOptionWithTrialAndIntroPricePaidUpfront,
      },
    },
    purchaseOptionToUse: subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    defaultPurchaseOption: subscriptionOptionWithTrialAndIntroPricePaidUpfront,
  }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>

<Story
  name="With Non Subscription product"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    productDetails: {
      ...consumableProduct,
    },
    purchaseOptionToUse: nonSubscriptionOption,
    defaultPurchaseOption: nonSubscriptionOption,
  }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>

<Story
  name="With Tax"
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
  name="With Tax and Trial Product"
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
  name="With Tax and Trial Product + Intro Price Paid Upfront"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    defaultPriceBreakdown: priceBreakdownTaxInclusiveWithIntroPricePaidUpfront,
    productDetails: {
      ...product,
      subscriptionOptions: {
        [subscriptionOptionWithTrialAndIntroPricePaidUpfront.id]:
          subscriptionOptionWithTrialAndIntroPricePaidUpfront,
      },
    },
    purchaseOptionToUse: subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    defaultPurchaseOption: subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    withTaxes: true,
  }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>

<Story
  name="With Tax Miss-Match"
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
