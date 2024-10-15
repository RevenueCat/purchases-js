<script lang="ts">
  import { Meta, Story, Template } from "@storybook/addon-svelte-csf";
  import StateNeedsPaymentInfo from "../ui/states/state-needs-payment-info.svelte";
  import Layout from "../ui/layout/layout.svelte";
  import Container from "../ui/layout/container.svelte";
  import Main from "../ui/layout/main-block.svelte";
  import ModalBackdrop from "../ui/modal-backdrop.svelte";

  import { brandingInfo, colorfulBrandingAppearance, product, purchaseResponse, subscriptionOption } from "./fixtures";

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
  <Container>
    <ModalBackdrop>
      <Layout>
        <Main brandingAppearance={args.brandingInfo.appearance}>
          <StateNeedsPaymentInfo {...args} />
        </Main>
      </Layout>
    </ModalBackdrop>
  </Container>
</Template>


<Story name='Standard' args={{...defaultArgs }} />

<Story name='Rounded' args={{...defaultArgs,  brandingInfo:{...brandingInfo,appearance:{
  shapes:'rounded'
}} }} />

<Story name='Pill' args={{ ...defaultArgs,  brandingInfo:{...brandingInfo,appearance:{
  shapes:'pill'
}} }} />

<Story name='Rectangle' args={{ ...defaultArgs,   brandingInfo:{...brandingInfo,appearance:{
  shapes:'rectangle'
}} }} />

<Story name='ColorfulRectangle'
       args={{ ...defaultArgs, brandingInfo:{...brandingInfo,appearance:colorfulBrandingAppearance} }} />
