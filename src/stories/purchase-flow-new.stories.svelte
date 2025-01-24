<script module>
  import { defineMeta, setTemplate } from "@storybook/addon-svelte-csf";
  import StateNeedsAuthInfo from "../ui/states/state-needs-auth-info.svelte";
  import StatePresentOffer from "../ui/states/state-present-offer.svelte";
  import BrandingInfoUI from "../ui/branding-info-ui.svelte";
  import NavBar from "../ui/layout/navbar.svelte";
  import Main from "../ui/layout/main-block.svelte";
  import Container from "../ui/layout/container.svelte";
  import WithContext from "./utils/with-context.svelte";

  import {
    brandingInfo,
    colorfulBrandingAppearance,
    product,
    purchaseFlowError,
    subscriptionOption,
  } from "./fixtures";

  const { Story } = defineMeta({
    title: "Purchase flow",
    args: {
      context: {},
      productDetails: product,
      purchaseOptionToUse: subscriptionOption,
      purchaseOption: subscriptionOption,
      brandingInfo: brandingInfo,
      lastError: purchaseFlowError,
      onContinue: () => {},
      context: {},
    },
    parameters: {},
  });
</script>

<script>
  setTemplate(template);
</script>

{#snippet template(args)}
  {#if args}
    {console.log("template args:", args)}
  {/if}
  <WithContext context={args.context}>
    {#if args}
      {console.log("args", args)}
    {/if}
    <Container>
      <NavBar brandingAppearance={args.brandingInfo.appearance}>
        {#snippet headerContent()}
          <BrandingInfoUI {...args} />
        {/snippet}

        {#snippet bodyContent(expanded)}
          <StatePresentOffer {...args} {expanded} />
        {/snippet}
      </NavBar>

      <Main brandingAppearance={args.brandingInfo.appearance}>
        <!-- {#if renderBody}
          {@html renderBody(args)}
        {:else} -->
        {#snippet body()}
          <StateNeedsAuthInfo {...args} />
        {/snippet}
        <!-- {/if} -->
      </Main>
    </Container>
  </WithContext>
{/snippet}

<Story name="Email Input" />
