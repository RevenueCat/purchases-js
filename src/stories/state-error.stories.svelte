<script>
  import { Meta, Story, Template } from "@storybook/addon-svelte-csf";
  import StateError from "../ui/states/state-error.svelte";
  import Layout from "../ui/layout/layout.svelte";
  import Container from "../ui/layout/container.svelte";
  import Main from "../ui/layout/main-block.svelte";
  import ModalBackdrop from "../ui/modal-backdrop.svelte";
  import { brandingInfo, colorfulBrandingAppearance, purchaseFlowError } from "./fixtures";

  let defaultArgs = {
    brandingInfo: brandingInfo, lastError: purchaseFlowError,
  };
</script>


<Meta title="StateError" component={StateError} />


<Template let:args>
  <Container>
    <ModalBackdrop>
      <Layout>
        <Main brandingAppearance={args.brandingAppearance}>
          <StateError {...args} />
        </Main>
      </Layout>
    </ModalBackdrop>
  </Container>
</Template>


<Story name='Standard' args={{ ...defaultArgs, brandingAppearance:{
} }} />

<Story name='Rounded' args={{  ...defaultArgs, brandingAppearance:{
  shapes:'rounded'
} }} />

<Story name='Pill' args={{ ...defaultArgs, brandingAppearance:{
  shapes:'pill'
} }} />

<Story name='Rectangle' args={{...defaultArgs, brandingAppearance:{
  shapes:'rectangle'
} }} />

<Story name='ColorfulRectangle'
       args={{ ...defaultArgs,  brandingAppearance:colorfulBrandingAppearance }} />