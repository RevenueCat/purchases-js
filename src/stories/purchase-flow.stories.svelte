<script module>
  import {
    defineMeta,
    setTemplate,
    type StoryContext,
    type Args,
  } from "@storybook/addon-svelte-csf";
  import PurchasesInner from "../ui/purchases-ui-inner.svelte";
  import { brandingLanguageViewportModes } from "../../.storybook/modes";

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
  import { PurchaseOperationHelper } from "../helpers/purchase-operation-helper";

  const defaultArgs = {
    productDetails: product,
    purchaseOptionToUse: subscriptionOption,
    purchaseOption: subscriptionOption,
    lastError: purchaseFlowError,
    onContinue: () => {},
  };

  let paymentInfoCollectionMetadata: any;

  let { Story } = defineMeta({
    title: "Flows/Purchase",
    args: defaultArgs,
    parameters: {
      viewport: {
        defaultViewport: "mobile",
      },
      chromatic: {
        modes: brandingLanguageViewportModes,
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
  {#if context.globals.viewport === "embedded"}
    {@render embedded(args, context)}
  {:else}
    {@render Purchases(args, context)}
  {/if}
{/snippet}

{#snippet Purchases(
  args: Args<typeof Story>,
  context: StoryContext<typeof Story>,
)}
  {@const brandingInfo = brandingInfos[context.globals.brandingName]}
  {@const colorVariables = toProductInfoStyleVar(brandingInfo.appearance)}
  <PurchasesInner
    isSandbox={args.isSandbox}
    currentView={args.currentView}
    productDetails={args.productDetails}
    purchaseOptionToUse={args.purchaseOptionToUse}
    {brandingInfo}
    {colorVariables}
    handleContinue={() => {}}
    closeWithError={() => {}}
    lastError={null}
    {paymentInfoCollectionMetadata}
    purchaseOperationHelper={null as unknown as PurchaseOperationHelper}
    isInElement={args.isInElement}
  />
{/snippet}

{#snippet embedded(
  args: Args<typeof Story>,
  context: StoryContext<typeof Story>,
)}
  <div style="width: 100vw; height:100vh; background-color: red;">
    <div style="display: flex">
      <div
        id="embedding-container"
        style="width: 500px; height: 600px; position: relative; overflow: hidden; background-color: lightgray;"
      >
        {@render Purchases({ ...args, isInElement: true }, context)}
      </div>
      <div style="padding: 20px;">
        <h1>Homer's Web page</h1>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
          quos.
        </p>
      </div>
    </div>
  </div>
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
<Story name="Checkout" args={{ currentView: "needs-payment-info" }} />
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
