<script module>
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import WithContext from "./utils/with-context.svelte";
  import { toProductInfoStyleVar } from "../ui/theme/utils";
  import RcbUiInner from "../ui/rcb-ui-inner.svelte";
  import { Translator } from "../ui/localization/translator";

  import {
    brandingInfo,
    product,
    purchaseFlowError,
    subscriptionOption,
    subscriptionOptionWithTrial,
  } from "./fixtures";
  import { buildCheckoutStartResponse } from "./utils/purchase-response-builder";
  import { translatorContextKey } from "../ui/localization/constants";
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
    title: "Purchase flow (Tablet)",
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
  parameters={{ viewport: { defaultViewport: "tablet" } }}
/>
