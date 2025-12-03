<script module lang="ts">
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import PurchasesInner from "../../ui/purchases-ui-inner.svelte";
  import SuccessPage from "../../ui/pages/success-page.svelte";
  import FullscreenTemplate from "../../ui/layout/fullscreen-template.svelte";
  import { brandingLanguageViewportModes } from "../../../.storybook/modes";
  import {
    brandingInfos,
    priceBreakdownTaxDisabled,
    product,
    subscriptionOption,
  } from "../fixtures";
  import { PurchaseOperationHelper } from "../../helpers/purchase-operation-helper";
  import { LocalizationKeys } from "../../ui/localization/supportedLanguages";
  import { getContext } from "svelte";
  import { translatorContextKey } from "../../ui/localization/constants";
  import type { Writable } from "svelte/store";
  import type { Translator } from "../../ui/localization/translator";
  import { get } from "svelte/store";

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
    forceEnableWalletMethods={false}
  />
{/snippet}

<Story name="Default" />

<Story name="Fullscreen Template"
  >{#snippet template(_args, context)}
    {@const brandingInfo = { ...brandingInfos[context.globals.brandingName] }}
    {@const translatorStore: Writable<Translator> = getContext(translatorContextKey)}
    {@const translator = get(translatorStore)}
    {@const title = translator.translate(
      LocalizationKeys.PaymentEntryPageSubscriptionInfo,
    )}

    <FullscreenTemplate
      {brandingInfo}
      isInElement={context.globals.viewport === "embedded"}
      isSandbox={false}
    >
      {#snippet mainContent()}
        <SuccessPage {title} onContinue={() => {}} fullWidth={true} />
      {/snippet}
    </FullscreenTemplate>
  {/snippet}
</Story>
