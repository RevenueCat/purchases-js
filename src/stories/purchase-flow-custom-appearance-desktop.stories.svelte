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
    title: "Purchase flow Custom Appearance (Desktop)",
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
      paymentInfoCollectionMetadata={paymentMetadata}
    />
  </WithContext>
{/snippet}

<Story name="Email Input" args={{ currentView: "needs-auth-info" }} />
<Story
  name="Email Input (with Sandbox Banner)"
  args={{
    currentView: "needs-auth-info",
    isSandbox: true,
  }}
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
  name="Checkout"
  args={{
    ...defaultArgs,
    currentView: "needs-payment-info",
  }}
/>
<Story
  name="Loading"
  args={{
    currentView: "loading",
  }}
/>
<Story
  name="Payment complete"
  args={{
    currentView: "success",
  }}
/>
<Story
  name="Payment failed"
  args={{
    currentView: "error",
  }}
/>
