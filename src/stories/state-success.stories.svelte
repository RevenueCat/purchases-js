<script>
  import { Meta, Story, Template } from "@storybook/addon-svelte-csf";
  import StateSuccess from "../ui/states/state-success.svelte";
  import Layout from "../ui/layout/layout.svelte";
  import Container from "../ui/layout/container.svelte";
  import Main from "../ui/layout/main-block.svelte";
  import ModalBackdrop from "../ui/modal-backdrop.svelte";
  import { brandingInfo, colorfulBrandingAppearance, product, subscriptionOption } from "./fixtures";

  let defaultArgs = {
    productDetails: product, purchaseOption: subscriptionOption, brandingInfo: brandingInfo,
  };
</script>


<Meta title="StateSuccess" component={StateSuccess} />


<Template let:args>
  <Container>
    <ModalBackdrop>
      <Layout>
        <Main brandingAppearance={args.brandingAppearance}>
          <StateSuccess {...args} />
        </Main>
      </Layout>
    </ModalBackdrop>
  </Container>
</Template>

<Story name='Standard' args={defaultArgs} />

<Story name='Rounded' args={{ ...defaultArgs,brandingAppearance:{
  shapes:'rounded'
} }} />

<Story name='Pill' args={{...defaultArgs, brandingAppearance:{
  shapes:'pill'
} }} />

<Story name='Rectangle' args={{ ...defaultArgs, brandingAppearance:{
  shapes:'rectangle'
} }} />

<Story name='ColorfulRectangle'
       args={{ ...defaultArgs,  brandingAppearance:colorfulBrandingAppearance }} />