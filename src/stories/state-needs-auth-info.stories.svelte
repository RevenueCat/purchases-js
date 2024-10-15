<script>
  import { Meta, Story, Template } from "@storybook/addon-svelte-csf";
  import StateNeedsAuthInfo from "../ui/states/state-needs-auth-info.svelte";
  import Layout from "../ui/layout/layout.svelte";
  import Container from "../ui/layout/container.svelte";
  import Main from "../ui/layout/main-block.svelte";
  import ModalBackdrop from "../ui/modal-backdrop.svelte";

  import { brandingInfo, colorfulBrandingAppearance, product, subscriptionOption } from "./fixtures";

  let defaultArgs = {
    productDetails: product, purchaseOption: subscriptionOption, brandingInfo: brandingInfo,
  };
</script>


<Meta title="StateNeedsAuthInfo" component={StateNeedsAuthInfo} />

<Template let:args>
  <Container>
    <ModalBackdrop>
      <Layout>
        <Main brandingAppearance={args.brandingAppearance}>
          <StateNeedsAuthInfo {...args} />
        </Main>
      </Layout>
    </ModalBackdrop>
  </Container>
</Template>


<Story name='Standard' args={{ ...defaultArgs, brandingAppearance:{} }} />

<Story name='Rounded' args={{ productDetails:product, purchaseOption:subscriptionOption, brandingAppearance:{
  shapes:'rounded'
} }} />

<Story name='Pill' args={{ productDetails:product, purchaseOption:subscriptionOption, brandingAppearance:{
  shapes:'pill'
} }} />

<Story name='Rectangle' args={{ productDetails:product, purchaseOption:subscriptionOption, brandingAppearance:{
  shapes:'rectangle'
} }} />

<Story name='ColorfulRectangle'
       args={{ ...defaultArgs,  brandingAppearance:colorfulBrandingAppearance }} />