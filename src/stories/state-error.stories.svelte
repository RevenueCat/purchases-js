<script>
  import { Meta, Story, Template } from "@storybook/addon-svelte-csf";
  import StateError from "../ui/states/state-error.svelte";
  import Shell from "../ui/shell.svelte";
  import { mapStyleOverridesToStyleVariables } from "../helpers/process-style-overrides.ts";
  import Layout from "../ui/layout/layout.svelte";
  import Container from "../ui/layout/container.svelte";
  import Aside from "../ui/layout/aside-block.svelte";
  import ModalBackdrop from "../ui/modal-backdrop.svelte";
  import { brandingInfo, purchaseFlowError } from "./fixtures";

  let defaultArgs = {
    brandingInfo: brandingInfo, lastError: purchaseFlowError,
  };
</script>


<Meta title="StateError" component={StateError} />


<Template let:args>
  <Container style={mapStyleOverridesToStyleVariables(args?.brandingAppearance)}>
    <ModalBackdrop>
      <Layout>
        <Aside>
          <Shell>
            <StateError {...args} />
          </Shell>
        </Aside>
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