<script module>
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import StateNeedsAuthInfo from "../ui/states/state-needs-auth-info.svelte";
  import StateNeedsPaymentInfo from "../ui/states/state-needs-payment-info.svelte";
  import StatePresentOffer from "../ui/states/state-present-offer.svelte";
  import StateSuccess from "../ui/states/state-success.svelte";
  import StateLoading from "../ui/states/state-loading.svelte";
  import StateError from "../ui/states/state-error.svelte";
  import BrandingInfoUI from "../ui/branding-info-ui.svelte";
  import NavBar from "../ui/layout/navbar.svelte";
  import Main from "../ui/layout/main-block.svelte";
  import Container from "../ui/layout/container.svelte";
  import WithContext from "./utils/with-context.svelte";
  import Layout from "../ui/layout/layout.svelte";
  import { toProductInfoStyleVar } from "../ui/theme/utils";
  import SandboxBanner from "../ui/sandbox-banner.svelte";
  import RcbUiInner from "../ui/rcb-ui-inner.svelte";

  import {
    brandingInfo,
    colorfulBrandingAppearance,
    product,
    purchaseFlowError,
    subscriptionOption,
  } from "./fixtures";
  import { onMount } from "svelte";
  import {
    buildPurchaseResponse,
    SetupMode,
  } from "./utils/purchase-response-builder";

  const defaultArgs = {
    context: {},
    productDetails: product,
    purchaseOptionToUse: subscriptionOption,
    purchaseOption: subscriptionOption,
    brandingInfo: brandingInfo,
    lastError: purchaseFlowError,
    onContinue: () => {},
    context: {},
  };

  let { Story } = defineMeta({
    title: "Purchase flow",
    args: defaultArgs,
    parameters: {},
  });

  let colorVariables = toProductInfoStyleVar(brandingInfo?.appearance);
</script>

<script>
  setTemplate(template);
</script>

{#snippet template(args)}
  <WithContext context={args.context}>
    <RcbUiInner {...args} {colorVariables} />
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
    args: defaultArgs,
    currentView: "needs-payment-info",
  }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>
<Story
  name="Checkout (Desktop)"
  args={(args) => {
    console.log(args);
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
