<script module>
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import WithContext from "./utils/with-context.svelte";
  import { toProductInfoStyleVar } from "../ui/theme/utils";
  import RcbUiInner from "../ui/rcb-ui-inner.svelte";

  import {
    brandingInfo,
    product,
    purchaseFlowError,
    subscriptionOption,
  } from "./fixtures";
  import {
    buildPurchaseResponse,
    SetupMode,
  } from "./utils/purchase-response-builder";
  import type { PurchaseResponse } from "../networking/responses/purchase-response";

  const defaultArgs = {
    context: {},
    productDetails: product,
    purchaseOptionToUse: subscriptionOption,
    purchaseOption: subscriptionOption,
    brandingInfo: brandingInfo,
    lastError: purchaseFlowError,
    onContinue: () => {},
  };

  let paymentMetadata: any;

  let { Story } = defineMeta({
    title: "Purchase flow",
    args: defaultArgs,
    parameters: {},
    loaders: [
      async () => {
        const paymentInfoCollectionMetadata: PurchaseResponse =
          await buildPurchaseResponse(SetupMode.TrialSubscription);
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
  <WithContext context={args.context}>
    <RcbUiInner
      {...args}
      {colorVariables}
      paymentInfoCollectionMetadata={paymentMetadata}
    />
  </WithContext>
{/snippet}

<Story
  name="Email Input (Mobile)"
  args={{ currentView: "needs-auth-info" }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>
<Story
  name="Email Input (Desktop)"
  args={{ currentView: "needs-auth-info" }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
<Story
  name="Email Input (with Sandbox Banner) (Mobile)"
  args={{
    currentView: "needs-auth-info",
    isSandbox: true,
  }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>
<Story
  name="Email Input (with Sandbox Banner) (Desktop)"
  args={{
    currentView: "needs-auth-info",
    isSandbox: true,
  }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
<Story
  name="Checkout (Mobile)"
  args={{
    ...defaultArgs,
    currentView: "needs-payment-info",
  }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>
<Story
  name="Checkout (Desktop)"
  args={{
    ...defaultArgs,
    currentView: "needs-payment-info",
  }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
<Story
  name="Loading (Mobile)"
  args={{
    currentView: "loading",
  }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>
<Story
  name="Loading (Desktop)"
  args={{
    currentView: "loading",
  }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
<Story
  name="Payment complete (Mobile)"
  args={{
    currentView: "success",
  }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>
<Story
  name="Payment failed (Mobile)"
  args={{
    currentView: "error",
  }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>
<Story
  name="Payment failed (Desktop)"
  args={{
    currentView: "error",
  }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
