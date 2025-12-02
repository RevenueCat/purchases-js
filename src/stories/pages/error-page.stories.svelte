<script module lang="ts">
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import PurchasesInner from "../../ui/purchases-ui-inner.svelte";
  import ErrorPage from "../../ui/pages/error-page.svelte";
  import FullscreenTemplate from "../../ui/layout/fullscreen-template.svelte";
  import { brandingLanguageViewportModes } from "../../../.storybook/modes";
  import {
    brandingInfos,
    priceBreakdownTaxDisabled,
    product,
    purchaseFlowErrors,
    subscriptionOption,
  } from "../fixtures";
  import { PurchaseOperationHelper } from "../../helpers/purchase-operation-helper";

  const defaultArgs = {
    productDetails: product,
    purchaseOptionToUse: subscriptionOption,
    purchaseOption: subscriptionOption,
    lastError: purchaseFlowErrors.unknownError,
  };

  let { Story } = defineMeta({
    component: PurchasesInner,
    title: "Pages/ErrorPage",
    args: defaultArgs,
    parameters: {
      viewport: {
        defaultViewport: "mobile",
      },
      chromatic: {
        modes: brandingLanguageViewportModes,
      },
    },
    // @ts-expect-error ignore importing before initializing
    render: template,
  });
  type StoryArgs = {
    productDetails: typeof product;
    purchaseOptionToUse: typeof subscriptionOption;
    purchaseOption: typeof subscriptionOption;
    lastError: (typeof purchaseFlowErrors)[keyof typeof purchaseFlowErrors];
  };
</script>

{#snippet template(
  args: StoryArgs,
  context: StoryContext<typeof PurchasesInner>,
)}
  {@const brandingInfo = { ...brandingInfos[context.globals.brandingName] }}
  <PurchasesInner
    isSandbox={false}
    currentPage="error"
    productDetails={args.productDetails}
    purchaseOptionToUse={args.purchaseOptionToUse}
    {brandingInfo}
    onContinue={() => {}}
    closeWithError={() => {}}
    customerEmail={null}
    gatewayParams={{}}
    purchaseOperationHelper={null as unknown as PurchaseOperationHelper}
    defaultPriceBreakdown={priceBreakdownTaxDisabled}
    isInElement={context.globals.viewport === "embedded"}
    onError={() => {}}
    onClose={() => {}}
    lastError={args.lastError}
    managementUrl="http://test.com"
    forceEnableWalletMethods={false}
  />
{/snippet}

<Story name="Unknown error" />
<Story
  name="Already purchased"
  args={{ lastError: purchaseFlowErrors.alreadyPurchasedError }}
/>
<Story
  name="Error setting up purchase"
  args={{ lastError: purchaseFlowErrors.errorSettingUpPurchase }}
/>
<Story
  name="Error charging payment"
  args={{ lastError: purchaseFlowErrors.errorChargingPayment }}
/>
<Story
  name="Network error"
  args={{ lastError: purchaseFlowErrors.networkError }}
/>
<Story
  name="Stripe Not Active"
  args={{ lastError: purchaseFlowErrors.stripeNotActive }}
/>
<Story
  name="Stripe Invalid Tax Origin Address"
  args={{ lastError: purchaseFlowErrors.stripeInvalidTaxOriginAddress }}
/>
<Story
  name="Stripe Missing Required Permission"
  args={{ lastError: purchaseFlowErrors.stripeMissingRequiredPermission }}
/>

<Story name="Fullscreen Template"
  >{#snippet template(_args, context)}
    {@const brandingInfo = { ...brandingInfos[context.globals.brandingName] }}
    <FullscreenTemplate
      {brandingInfo}
      isInElement={context.globals.viewport === "embedded"}
      isSandbox={false}
    >
      {#snippet mainContent()}
        <ErrorPage
          lastError={purchaseFlowErrors.networkError}
          productDetails={product}
          supportEmail={brandingInfo?.support_email ?? null}
          onDismiss={() => {}}
          appName={brandingInfo?.app_name ?? null}
          fullWidth={true}
        />
      {/snippet}
    </FullscreenTemplate>
  {/snippet}
</Story>
