<script module lang="ts">
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
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
    priceBreakdownTaxInclusiveWithIntroPriceRecurring,
    subscriptionOptionWithTrialAndIntroPriceRecurring,
    subscriptionOptionWithIntroPriceRecurring,
    subscriptionOptionWithIntroPricePaidUpfront,
    consumableProduct,
    nonSubscriptionOption,
  } from "../fixtures";
  import { PurchaseOperationHelper } from "../../helpers/purchase-operation-helper";

  const defaultArgs = {
    productDetails: product,
    purchaseOptionToUse: subscriptionOption,
    purchaseOption: subscriptionOption,
    onContinue: () => {},
  };

  let { Story } = defineMeta({
    component: PurchasesInner,
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
    // @ts-expect-error ignore importing before initializing
    render: template,
  });
  type StoryArgs = any;
  let purchaseOperationHelper = null as unknown as PurchaseOperationHelper;
</script>

{#snippet template(
  args: StoryArgs,
  context: StoryContext<typeof PurchasesInner>,
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
    termsAndConditionsUrl={args.termsAndConditionsUrl}
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
  name="With Tax and Trial Product + Intro Price Recurring"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    defaultPriceBreakdown: priceBreakdownTaxInclusiveWithIntroPriceRecurring,
    productDetails: {
      ...product,
      subscriptionOptions: {
        [subscriptionOptionWithTrialAndIntroPriceRecurring.id]:
          subscriptionOptionWithTrialAndIntroPriceRecurring,
      },
    },
    purchaseOptionToUse: subscriptionOptionWithTrialAndIntroPriceRecurring,
    defaultPurchaseOption: subscriptionOptionWithTrialAndIntroPriceRecurring,
    withTaxes: true,
  }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>

<Story
  name="With Tax and Intro Price Paid Upfront"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    defaultPriceBreakdown: priceBreakdownTaxInclusiveWithIntroPricePaidUpfront,
    productDetails: {
      ...product,
      subscriptionOptions: {
        [subscriptionOptionWithIntroPricePaidUpfront.id]:
          subscriptionOptionWithIntroPricePaidUpfront,
      },
    },
    purchaseOptionToUse: subscriptionOptionWithIntroPricePaidUpfront,
    defaultPurchaseOption: subscriptionOptionWithIntroPricePaidUpfront,
    withTaxes: true,
  }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>

<Story
  name="With Tax and Intro Price Recurring"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    defaultPriceBreakdown: priceBreakdownTaxInclusiveWithIntroPriceRecurring,
    productDetails: {
      ...product,
      subscriptionOptions: {
        [subscriptionOptionWithIntroPriceRecurring.id]:
          subscriptionOptionWithIntroPriceRecurring,
      },
    },
    purchaseOptionToUse: subscriptionOptionWithIntroPriceRecurring,
    defaultPurchaseOption: subscriptionOptionWithIntroPriceRecurring,
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

<Story
  name="With Terms & Conditions URL"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    termsAndConditionsUrl: "https://www.revenuecat.com/terms",
  }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>
