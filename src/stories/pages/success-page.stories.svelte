<script module lang="ts">
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import PurchasesInner from "../../ui/purchases-ui-inner.svelte";
  import { brandingLanguageViewportModes } from "../../../.storybook/modes";
  import {
    brandingInfos,
    priceBreakdownTaxDisabled,
    product,
    subscriptionOption,
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
    title: "Pages/SuccessPage",
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
  };
</script>

{#snippet template(
  args: StoryArgs,
  context: StoryContext<typeof PurchasesInner>,
)}
  {@const brandingInfo = { ...brandingInfos[context.globals.brandingName] }}
  <PurchasesInner
    isSandbox={false}
    currentPage="success"
    productDetails={args.productDetails}
    purchaseOptionToUse={args.purchaseOptionToUse}
    {brandingInfo}
    onContinue={() => {}}
    closeWithError={() => {}}
    customerEmail={null}
    lastError={null}
    gatewayParams={{}}
    purchaseOperationHelper={null as unknown as PurchaseOperationHelper}
    defaultPriceBreakdown={priceBreakdownTaxDisabled}
    isInElement={context.globals.viewport === "embedded"}
    onError={() => {}}
    onClose={() => {}}
    managementUrl="http://test.com"
  />
{/snippet}

<Story name="Default" />
