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
  });
</script>

<script lang="ts">
  setTemplate(template);
</script>

{#snippet template(
  args: Args<typeof Story>,
  context: StoryContext<typeof Story>,
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
