<script module lang="ts">
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import { action } from "@storybook/addon-actions";

  import PaddlePurchasesUiInner from "../../ui/paddle-purchases-ui-inner.svelte";
  import { brandingLanguageViewportModes } from "../../../.storybook/modes";
  import {
    brandingInfos,
    priceBreakdownTaxDisabled,
    product,
    purchaseFlowErrors,
    subscriptionOption,
  } from "../fixtures";

  let { Story } = defineMeta({
    component: PaddlePurchasesUiInner,
    title: "Pages/PaddlePurchaseUiInner",
    args: {
      productDetails: product,
      purchaseOption: subscriptionOption,
      isSandbox: false,
      lastError: null,
      defaultPriceBreakdown: priceBreakdownTaxDisabled,
      onContinue: action("onContinue"),
      closeWithError: action("closeWithError"),
      onClose: action("onClose"),
    },
    parameters: {
      viewport: {
        defaultViewport: "mobile",
      },
      chromatic: {
        modes: brandingLanguageViewportModes,
      },
    },
    render: template,
  });
  type StoryArgs = any;
</script>

{#snippet template(
  args: StoryArgs,
  context: StoryContext<typeof PaddlePurchasesUiInner>,
)}
  {@const brandingInfo = { ...brandingInfos[context.globals.brandingName] }}
  <PaddlePurchasesUiInner
    {...args}
    {brandingInfo}
    isInElement={context.globals.viewport === "embedded"}
  />
{/snippet}

<Story name="Loading" args={{ currentPage: "loading" }} />

<Story
  name="Loading With Sandbox Banner"
  args={{ currentPage: "loading", isSandbox: true }}
/>

<Story name="Success" args={{ currentPage: "success" }} />

<Story
  name="Success With Sandbox Banner"
  args={{ currentPage: "success", isSandbox: true }}
/>

<Story
  name="Error"
  args={{
    currentPage: "error",
    lastError: purchaseFlowErrors.errorSettingUpPurchase,
  }}
/>

<Story
  name="Error with Sandbox Banner"
  args={{
    currentPage: "error",
    lastError: purchaseFlowErrors.errorSettingUpPurchase,
    isSandbox: true,
  }}
/>
