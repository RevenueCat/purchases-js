<script>
  import { Meta, Story, Template } from "@storybook/addon-svelte-csf";
  import StatePresentOffer from "../ui/states/state-present-offer.svelte";
  import SandboxBanner from "../ui/sandbox-banner.svelte";
  import Layout from "../ui/layout/layout.svelte";
  import Container from "../ui/layout/container.svelte";
  import Aside from "../ui/layout/aside-block.svelte";
  import ModalBackdrop from "../ui/modal-backdrop.svelte";
  import { brandingInfo, colorfulBrandingAppearance, product, subscriptionOption } from "./fixtures";
  import IconCart from "../ui/icons/icon-cart.svelte";
  import ModalHeader from "../ui/modal-header.svelte";
  import BrandingInfoUI from "../ui/branding-info-ui.svelte";

  let defaultArgs = {
    productDetails: product, purchaseOption: subscriptionOption, brandingInfo: brandingInfo,
    sandbox: false,
  };
</script>


<Meta title="StatePresentsOffer" component={StatePresentOffer} />


<Template let:args>
  <Container>
    <ModalBackdrop>
      <Layout>
        <Aside brandingAppearance={args.brandingAppearance}>
          <ModalHeader slot="header">
            <BrandingInfoUI {...args} />
            {#if args.sandbox}
              <SandboxBanner />
            {:else}
              <IconCart />
            {/if}
          </ModalHeader>
          <StatePresentOffer {...args} />
        </Aside>
      </Layout>
    </ModalBackdrop>
  </Container>
</Template>


<Story name='Standard' args={{ ...defaultArgs, brandingAppearance:{
} }} />

<Story name='Rounded' args={{ ...defaultArgs, brandingAppearance:{
  shapes:'rounded'
} }} />

<Story name='Pill' args={{ ...defaultArgs, brandingAppearance:{
  shapes:'pill'
} }} />

<Story name='Rectangle' args={{ ...defaultArgs, brandingAppearance:{
  shapes:'rectangle'
} }} />

<Story name='Sandbox'
       args={{ ...defaultArgs,  sandbox: true, brandingAppearance:{} }} />

<Story name='ColorfulRectangle'
       args={{ ...defaultArgs,  brandingAppearance:colorfulBrandingAppearance }} />