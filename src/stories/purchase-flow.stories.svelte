<script module>
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import StateNeedsAuthInfo from "../ui/states/state-needs-auth-info.svelte";
  import StateNeedsPaymentInfo from "../ui/states/state-needs-payment-info.svelte";
  import StatePresentOffer from "../ui/states/state-present-offer.svelte";
  import StateSuccess from "../ui/states/state-success.svelte";
  import StateLoading from "../ui/states/state-loading.svelte";
  import StateError from "../ui/states/state-error.svelte";
  import StateNeedsPaymentInfoWithPurchaseResponse from "./utils/state-needs-payment-info-with-purchase-response.svelte";
  import BrandingInfoUI from "../ui/branding-info-ui.svelte";
  import NavBar from "../ui/layout/navbar.svelte";
  import Main from "../ui/layout/main-block.svelte";
  import Container from "../ui/layout/container.svelte";
  import WithContext from "./utils/with-context.svelte";
  import Layout from "../ui/layout/layout.svelte";
  import { toProductInfoStyleVar } from "../ui/theme/utils";
  import SandboxBanner from "../ui/sandbox-banner.svelte";

  import {
    brandingInfo,
    colorfulBrandingAppearance,
    product,
    purchaseFlowError,
    subscriptionOption,
  } from "./fixtures";
  import { onMount } from "svelte";

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

  const { Story } = defineMeta({
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
    <Container brandingAppearance={args.brandingInfo.appearance}>
      {#if args.context.isSandbox}
        <SandboxBanner style={colorVariables} />
      {/if}
      <Layout style={colorVariables}>
        <NavBar brandingAppearance={args.brandingInfo.appearance}>
          {#snippet headerContent()}
            <BrandingInfoUI {...args} />
          {/snippet}

          {#snippet bodyContent(expanded)}
            <StatePresentOffer {...args} {expanded} />
          {/snippet}
        </NavBar>

        <Main brandingAppearance={args.brandingInfo.appearance}>
          {#snippet header()}
            {#if args.renderHeader}
              <svelte:component this={args.renderHeader} {...args} />
            {/if}
          {/snippet}
          {#snippet body()}
            <svelte:component this={args.renderBody} {...args} />
          {/snippet}
        </Main>
      </Layout>
    </Container>
  </WithContext>
{/snippet}

<Story
  name="Email Input (Mobile)"
  args={{ renderBody: StateNeedsAuthInfo }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>
<Story
  name="Email Input (Desktop)"
  args={{ renderBody: StateNeedsAuthInfo }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
<Story
  name="Email Input (with Sandbox Banner) (Mobile)"
  args={{
    renderBody: StateNeedsAuthInfo,
    context: {
      isSandbox: true,
    },
  }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>
<Story
  name="Email Input (with Sandbox Banner) (Desktop)"
  args={{
    renderBody: StateNeedsAuthInfo,
    context: {
      isSandbox: true,
    },
  }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
<Story
  name="Checkout (Mobile)"
  args={{
    args: defaultArgs,
    renderBody: StateNeedsPaymentInfoWithPurchaseResponse,
  }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>
<Story
  name="Checkout (Desktop)"
  args={{
    args: defaultArgs,
    renderBody: StateNeedsPaymentInfoWithPurchaseResponse,
  }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
<Story
  name="Loading (Mobile)"
  args={{
    renderBody: StateLoading,
  }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>
<Story
  name="Loading (Desktop)"
  args={{
    renderBody: StateLoading,
  }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
<Story
  name="Payment complete (Mobile)"
  args={{
    renderBody: StateSuccess,
  }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>
<Story
  name="Payment failed (Mobile)"
  args={{
    renderBody: StateError,
  }}
  parameters={{ viewport: { defaultViewport: "mobile" } }}
/>
<Story
  name="Payment failed (Desktop)"
  args={{
    renderBody: StateError,
  }}
  parameters={{ viewport: { defaultViewport: "desktop" } }}
/>
