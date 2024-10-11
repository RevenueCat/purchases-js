<script lang="ts">
  import { Meta, Story, Template } from "@storybook/addon-svelte-csf";
  import StateNeedsPaymentInfo from "../ui/states/state-needs-payment-info.svelte";
  import Shell from "../ui/shell.svelte";
  import { mapStyleOverridesToStyleVariables } from "../helpers/process-style-overrides.ts";
  import Layout from "../ui/layout/layout.svelte";
  import Container from "../ui/layout/container.svelte";
  import Main from "../ui/layout/main-block.svelte";
  import ModalBackdrop from "../ui/modal-backdrop.svelte";

  import { product, purchaseResponse, subscriptionOption } from "./fixtures";

  let defaultArgs = {
    paymentInfoCollectionMetadata: purchaseResponse,
    productDetails: product,
    purchaseOptionToUse: subscriptionOption,
    onContinue: () => {
    },
  };
</script>


<Meta title="StateNeedsPaymentInfo" component={StateNeedsPaymentInfo} />


<Template let:args>
  <Container style={mapStyleOverridesToStyleVariables(args?.brandingAppearance)}>
    <ModalBackdrop>
      <Layout>
        <Main>
          <Shell>
            <StateNeedsPaymentInfo {...args} />
          </Shell>
        </Main>
      </Layout>
    </ModalBackdrop>
  </Container>
</Template>


<Story name='Standard' args={{...defaultArgs, brandingAppearance:{} }} />

<Story name='Rounded' args={{...defaultArgs, purchaseOptionToUse:subscriptionOption, brandingAppearance:{
  shapes:'rounded',
  color_error:'blue',
  color_accent:'yellow'
} }} />

<Story name='Pill' args={{ ...defaultArgs, purchaseOptionToUse:subscriptionOption, brandingAppearance:{
  shapes:'pill',
  color_error:'purple',
  color_accent:'green'
} }} />

<Story name='Rectangle' args={{ ...defaultArgs, purchaseOptionToUse:subscriptionOption, brandingAppearance:{
  shapes:'rectangle'
} }} />