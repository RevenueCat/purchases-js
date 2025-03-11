<script module>
  import {
    defineMeta,
    setTemplate,
    type StoryContext,
    type Args,
  } from "@storybook/addon-svelte-csf";
  import RcbUiInner from "../ui/rcb-ui-inner.svelte";

  import {
    brandingInfos,
    product,
    purchaseFlowError,
    subscriptionOption,
    subscriptionOptionWithTrial,
  } from "./fixtures";
  import { buildCheckoutStartResponse } from "./utils/purchase-response-builder";
  import { type CheckoutStartResponse } from "../networking/responses/checkout-start-response";
  import { toProductInfoStyleVar } from "../ui/theme/utils";

  const defaultArgs = {
    productDetails: product,
    purchaseOptionToUse: subscriptionOption,
    purchaseOption: subscriptionOption,
    lastError: purchaseFlowError,
    onContinue: () => {},
  };

  let paymentInfoCollectionMetadata: any;

  let { Story } = defineMeta({
    title: "Purchase flow (Mobile)",
    args: defaultArgs,
    parameters: {
      viewport: {
        defaultViewport: "mobile",
      },
    },
    loaders: [
      async () => {
        const checkoutStartResponse: CheckoutStartResponse =
          await buildCheckoutStartResponse();
        paymentInfoCollectionMetadata = { ...checkoutStartResponse };
        return { paymentInfoCollectionMetadata };
      },
    ],
  });
</script>

<script lang="ts">
  setTemplate(template);
</script>

{#snippet template(
  args: Args<typeof Story>,
  context: StoryContext<typeof Story>,
)}
  {@const brandingInfo = brandingInfos[context.globals.brandingName]}
  {@const colorVariables = toProductInfoStyleVar(brandingInfo.appearance)}
  {@const reactiveArgs = {
    ...args,
    brandingInfo,
    colorVariables,
    paymentInfoCollectionMetadata,
  }}
  <RcbUiInner {...reactiveArgs} />
{/snippet}

<Story name="Email Input" args={{ currentView: "needs-auth-info" }} />
<Story
  name="Email Input (with Sandbox Banner)"
  args={{ currentView: "needs-auth-info", isSandbox: true }}
/>

<Story
  name="Email Input (with Trial Product)"
  args={{
    currentView: "needs-auth-info",
    isSandbox: true,
    productDetails: {
      ...product,
      normalPeriodDuration: "P1Y",
    },
    purchaseOptionToUse: subscriptionOptionWithTrial,
  }}
/>

<Story
  name="Checkout (with Trial Product)"
  args={{
    ...defaultArgs,
    currentView: "needs-payment-info",
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
<Story name="Loading" args={{ currentView: "loading" }} />
<Story name="Payment complete" args={{ currentView: "success" }} />
<Story name="Payment failed" args={{ currentView: "error" }} />
