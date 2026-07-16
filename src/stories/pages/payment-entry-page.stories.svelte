<script module lang="ts">
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import PurchasesInner from "../../ui/purchases-ui-inner.svelte";
  import { brandingLanguageViewportModes } from "../../../.storybook/modes";
  import {
    brandingInfos,
    checkoutStartResponse,
    product,
    subscriptionOption,
    subscriptionOptionWithDiscountOneTime,
    subscriptionOptionWithTrial,
    subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    subscriptionOptionWithTrialAndIntroPriceRecurring,
    subscriptionOptionWithIntroPriceRecurring,
    subscriptionOptionWithIntroPricePaidUpfront,
    consumableProduct,
    nonSubscriptionOption,
  } from "../fixtures";
  import {
    getPriceBreakdownTaxInclusive,
    getPriceBreakdownTaxDisabled,
  } from "../helpers/get-price-breakdown";
  import { PurchaseOperationHelper } from "../../helpers/purchase-operation-helper";

  const defaultArgs = {
    productDetails: product,
    purchaseOptionToUse: subscriptionOption,
    purchaseOption: subscriptionOption,
    forceEnableWalletMethods: false,
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
    // @ts-ignore ignore importing before initializing
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
    full_address_collection_mode:
      args.fullAddressCollectionMode ??
      brandingInfos[context.globals.brandingName].full_address_collection_mode,
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
      (args.withTaxes
        ? getPriceBreakdownTaxInclusive(subscriptionOption)
        : undefined)}
    isInElement={context.globals.viewport === "embedded"}
    onError={() => {}}
    onClose={() => {}}
    managementUrl="http://test.com"
    termsAndConditionsUrl={args.termsAndConditionsUrl}
    checkoutConsentRequired={args.checkoutConsentRequired}
    showDiscountCodeField={args.showDiscountCodeField}
    draftDiscountCode={args.draftDiscountCode}
    appliedDiscountCode={args.appliedDiscountCode}
    discountCodeError={args.discountCodeError}
    isUpdatingDiscountCode={args.isUpdatingDiscountCode}
    isDiscountCodeControlsEnabled={args.isDiscountCodeControlsEnabled}
    onDraftDiscountCodeChange={args.onDraftDiscountCodeChange}
    onApplyDiscountCode={args.onApplyDiscountCode}
    onRemoveDiscountCode={args.onRemoveDiscountCode}
    forceEnableWalletMethods={args.forceEnableWalletMethods}
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
  name="With Promo Code Field"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    showDiscountCodeField: true,
    isDiscountCodeControlsEnabled: true,
  }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>

<Story
  name="With Promo Code Field Error"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    showDiscountCodeField: true,
    draftDiscountCode: "BADCODE",
    discountCodeError: "Invalid discount code.",
    isDiscountCodeControlsEnabled: true,
  }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>

<Story
  name="With Applied Promo Code"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    defaultPriceBreakdown: {
      currency: "USD",
      originalAmountInMicros: 9900000,
      totalAmountInMicros: 8900000,
      totalExcludingTaxInMicros: 8900000,
      taxCalculationStatus: "unavailable",
      taxAmountInMicros: 0,
      taxBreakdown: null,
      appliedDiscounts: [
        {
          identifier: "discount-id",
          displayName: "SAVE10",
          discountedAmountInMicros: 1000000,
          percentage: 10,
          discountCode: "SAVE10",
          durationMode: null,
          timeWindow: null,
        },
      ],
    },
    productDetails: {
      ...product,
      subscriptionOptions: {
        ...product.subscriptionOptions,
        [subscriptionOptionWithDiscountOneTime.id]:
          subscriptionOptionWithDiscountOneTime,
      },
    },
    purchaseOptionToUse: subscriptionOptionWithDiscountOneTime,
    showDiscountCodeField: true,
    appliedDiscountCode: "SAVE10",
    isDiscountCodeControlsEnabled: true,
  }}
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
    defaultPriceBreakdown: getPriceBreakdownTaxDisabled(
      subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    ),
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
  name="With Full Billing Address"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    fullAddressCollectionMode: "always",
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
    defaultPriceBreakdown: getPriceBreakdownTaxInclusive(
      subscriptionOptionWithTrialAndIntroPricePaidUpfront,
    ),
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
    defaultPriceBreakdown: getPriceBreakdownTaxInclusive(
      subscriptionOptionWithTrialAndIntroPriceRecurring,
    ),
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
    defaultPriceBreakdown: getPriceBreakdownTaxInclusive(
      subscriptionOptionWithIntroPricePaidUpfront,
    ),
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
    defaultPriceBreakdown: getPriceBreakdownTaxInclusive(
      subscriptionOptionWithIntroPriceRecurring,
    ),
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
      ...getPriceBreakdownTaxInclusive(subscriptionOption),
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

<Story
  name="With Checkout Consent"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    checkoutConsentRequired: true,
    termsAndConditionsUrl: "https://www.revenuecat.com/terms",
  }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>

<Story
  name="With Checkout Consent Trial"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    purchaseOptionToUse: subscriptionOptionWithTrial,
    checkoutConsentRequired: true,
    termsAndConditionsUrl: "https://www.revenuecat.com/terms",
  }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>

<Story
  name="With Checkout Consent Long Copy"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    checkoutConsentRequired: true,
    termsAndConditionsUrl: "https://www.revenuecat.com/terms",
  }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>

<Story
  name="With Checkout Consent Missing Terms URL"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    checkoutConsentRequired: true,
    termsAndConditionsUrl: undefined,
  }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>

<Story
  name="With Force Enable Wallet Methods"
  args={{
    ...defaultArgs,
    currentPage: "payment-entry",
    forceEnableWalletMethods: true,
  }}
  parameters={{
    chromatic: {
      delay: 1000,
    },
  }}
/>
