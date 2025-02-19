<script module>
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import WithContext from "./utils/with-context.svelte";
  import { toProductInfoStyleVar } from "../ui/theme/utils";
  import RcbUiInner from "../ui/rcb-ui-inner.svelte";
  import { translatorContextKey } from "../ui/localization/constants";
  import { Translator } from "../ui/localization/translator";
  import {
    brandingInfo,
    colorfulBrandingAppearance,
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
    brandingInfo: { ...brandingInfo, appearance: colorfulBrandingAppearance },
    lastError: purchaseFlowError,
    onContinue: () => {},
  };

  let paymentMetadata: any;

  let { Story } = defineMeta({
    title: "Purchase flow (Desktop Embedded)",
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
  import { eventsTrackerContextKey } from "../ui/constants";

  setTemplate(template);
</script>

{#snippet template(args: any)}
  <div
    id="embedding-container"
    style="width: 500px; height: 600px; position: relative; overflow: hidden; background-color: lightgray;"
  >
    <WithContext
      context={{
        ...args.context,
        [translatorContextKey]: args.locale
          ? new Translator({}, args.locale, args.locale)
          : undefined,
        [eventsTrackerContextKey]: { trackSDKEvent: () => {} },
      }}
    >
      <RcbUiInner
        {...args}
        {colorVariables}
        isInElement={true}
        paymentInfoCollectionMetadata={paymentMetadata}
      />
    </WithContext>
  </div>
{/snippet}

<Story
  name="Email Input"
  args={{ currentView: "needs-auth-info" }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
<Story
  name="Email Input (with Sandbox Banner)"
  args={{
    currentView: "needs-auth-info",
    isSandbox: true,
  }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
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
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
<Story
  name="Checkout"
  args={{
    ...defaultArgs,
    currentView: "needs-payment-info",
  }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
<Story
  name="Loading"
  args={{
    currentView: "loading",
  }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
<Story
  name="Payment complete"
  args={{
    currentView: "success",
  }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
<Story
  name="Payment failed"
  args={{
    currentView: "error",
  }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
<Story
  name="Email Input (Arabic)"
  args={{ currentView: "needs-auth-info", locale: "ar" }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
<Story
  name="Email Input (with Sandbox Banner) (Arabic)"
  args={{
    currentView: "needs-auth-info",
    isSandbox: true,
    locale: "ar",
  }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
<Story
  name="Email Input (with Trial Product) (Arabic)"
  args={{
    currentView: "needs-auth-info",
    isSandbox: true,
    locale: "ar",
    productDetails: {
      ...product,
      normalPeriodDuration: "P1Y",
    },
    purchaseOptionToUse: subscriptionOptionWithTrial,
  }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
<Story
  name="Checkout (Arabic)"
  args={{
    ...defaultArgs,
    currentView: "needs-payment-info",
    locale: "ar",
  }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
<Story
  name="Loading (Arabic)"
  args={{
    currentView: "loading",
    locale: "ar",
  }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
<Story
  name="Payment complete (Arabic)"
  args={{
    currentView: "success",
    locale: "ar",
  }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
<Story
  name="Payment failed (Arabic)"
  args={{
    currentView: "error",
    locale: "ar",
  }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
