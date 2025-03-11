<script module>
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import { toProductInfoStyleVar } from "../ui/theme/utils";
  import RcbUiInner from "../ui/rcb-ui-inner.svelte";
  import {
    brandingInfo,
    product,
    purchaseFlowError,
    subscriptionOption,
    subscriptionOptionWithTrial,
  } from "./fixtures";
  import { buildCheckoutStartResponse } from "./utils/purchase-response-builder";
  import { type CheckoutStartResponse } from "../networking/responses/checkout-start-response";

  const defaultArgs = {
    context: {},
    productDetails: product,
    purchaseOptionToUse: subscriptionOption,
    purchaseOption: subscriptionOption,
    brandingInfo: { ...brandingInfo },
    lastError: purchaseFlowError,
    onContinue: () => {},
  };

  let paymentMetadata: any;

  let { Story } = defineMeta({
    title: "Purchase flow Right To Left (Mobile)",
    args: defaultArgs,
    parameters: {},
    loaders: [
      async () => {
        const paymentInfoCollectionMetadata: CheckoutStartResponse =
          await buildCheckoutStartResponse();
        paymentMetadata = { ...paymentInfoCollectionMetadata };
        return { paymentInfoCollectionMetadata };
      },
    ],
  });

  // @ts-ignore
  let colorVariables = toProductInfoStyleVar(brandingInfo?.appearance);
</script>

<script lang="ts">
  setTemplate(template);
</script>

{#snippet template(args: any)}
  <RcbUiInner
    {...args}
    {colorVariables}
    paymentInfoCollectionMetadata={paymentMetadata}
  />
{/snippet}

<Story
  name="Email Input (Arabic)"
  args={{ currentView: "needs-auth-info" }}
  globals={{ locale: "ar" }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>
<Story
  name="Email Input (with Sandbox Banner) (Arabic)"
  args={{
    currentView: "needs-auth-info",
    isSandbox: true,
  }}
  globals={{ locale: "ar" }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>
<Story
  name="Email Input (with Trial Product) (Arabic)"
  args={{
    currentView: "needs-auth-info",
    isSandbox: true,
    productDetails: {
      ...product,
      normalPeriodDuration: "P1Y",
    },
    purchaseOptionToUse: subscriptionOptionWithTrial,
  }}
  globals={{ locale: "ar" }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>
<Story
  name="Checkout (Arabic)"
  args={{
    ...defaultArgs,
    currentView: "needs-payment-info",
  }}
  globals={{ locale: "ar" }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>
<Story
  name="Loading (Arabic)"
  args={{
    currentView: "loading",
  }}
  globals={{ locale: "ar" }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>
<Story
  name="Payment complete (Arabic)"
  args={{
    currentView: "success",
  }}
  globals={{ locale: "ar" }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>
<Story
  name="Payment failed (Arabic)"
  args={{
    currentView: "error",
  }}
  globals={{ locale: "ar" }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>
