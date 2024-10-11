<script>
  import { Meta, Story, Template } from "@storybook/addon-svelte-csf";
  import StateLoading from "../ui/states/state-loading.svelte";
  import Shell from "../ui/shell.svelte";
  import { toStyleVar } from "../helpers/process-style-overrides.ts";
  import Layout from "../ui/layout/layout.svelte";
  import Container from "../ui/layout/container.svelte";
  import Aside from "../ui/layout/aside-block.svelte";
  import ModalBackdrop from "../ui/modal-backdrop.svelte";

  import { product, subscriptionOption } from "./fixtures";
</script>


<Meta title="StateLoading" component={StateLoading} />


<Template let:args>
  <Container style={toStyleVar(args?.brandingAppearance)}>
    <ModalBackdrop>
      <Layout>
        <Aside>
          <Shell>
            <StateLoading {...args} />
          </Shell>
        </Aside>
      </Layout>
    </ModalBackdrop>
  </Container>
</Template>


<Story name='Standard' args={{ productDetails:product, purchaseOption:subscriptionOption, brandingAppearance:{
} }} />

<Story name='Rounded' args={{ productDetails:product, purchaseOption:subscriptionOption, brandingAppearance:{
  shapes:'rounded'
} }} />

<Story name='Pill' args={{ productDetails:product, purchaseOption:subscriptionOption, brandingAppearance:{
  shapes:'pill'
} }} />

<Story name='Rectangle' args={{ productDetails:product, purchaseOption:subscriptionOption, brandingAppearance:{
  shapes:'rectangle'
} }} />