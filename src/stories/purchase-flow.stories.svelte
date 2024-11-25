<script>
  import { Meta, Story, Template } from "@storybook/addon-svelte-csf";
  import StateNeedsPaymentInfo from "../ui/states/state-needs-payment-info.svelte";
  import StateNeedsAuthInfo from "../ui/states/state-needs-auth-info.svelte";
  import StatePresentOffer from "../ui/states/state-present-offer.svelte";
  import StateSuccess from "../ui/states/state-success.svelte";
  import StateError from "../ui/states/state-error.svelte";
  import StateLoading from "../ui/states/state-loading.svelte";

  import Layout from "../ui/layout/layout.svelte";
  import Container from "../ui/layout/container.svelte";
  import Main from "../ui/layout/main-block.svelte";
  import Aside from "../ui/layout/aside-block.svelte";
  import IconCart from "../ui/icons/icon-cart.svelte";
  import ModalHeader from "../ui/modal-header.svelte";
  import BrandingInfoUI from "../ui/branding-info-ui.svelte";

  import {
    brandingInfo,
    colorfulBrandingAppearance,
    product,
    purchaseFlowError,
    purchaseResponse,
    subscriptionOption,
  } from "./fixtures";


  let defaultArgs = {
    paymentInfoCollectionMetadata: purchaseResponse,
    productDetails: product,
    purchaseOptionToUse: subscriptionOption,
    purchaseOption: subscriptionOption,
    brandingInfo: brandingInfo,
    lastError: purchaseFlowError,
    onContinue: () => {
    },
  };
</script>


<Meta title="PurchaseFlow" component={StateNeedsPaymentInfo} />


<Template let:args>
  <div style="background-color: rgba(40, 40, 40, 0.75); width: 100vw; min-height: 100vh; padding-top:100px">
    <Container>
      <Layout>
        <Aside brandingAppearance={args.brandingInfo.appearance}>
          <ModalHeader slot="header">
            <BrandingInfoUI {...args} />
            <IconCart />
          </ModalHeader>
          <StatePresentOffer {...args} />
        </Aside>
        <Main brandingAppearance={args.brandingInfo.appearance}>
          <StateNeedsAuthInfo {...args} />
        </Main>
      </Layout>
    </Container>

    <div style="height: 100px" />

    <Container>
      <Layout>
        <Aside brandingAppearance={args.brandingInfo.appearance}>
          <ModalHeader slot="header">
            <BrandingInfoUI {...args} />
            <IconCart />
          </ModalHeader>
          <StatePresentOffer {...args} />
        </Aside>
        <Main brandingAppearance={args.brandingInfo.appearance}>
          <StateNeedsPaymentInfo {...args} />
        </Main>
      </Layout>
    </Container>

    <div style="height: 100px" />

    <Container>
      <Layout>
        <Aside brandingAppearance={args.brandingInfo.appearance}>
          <ModalHeader slot="header">
            <BrandingInfoUI {...args} />
            <IconCart />
          </ModalHeader>
          <StatePresentOffer {...args} />
        </Aside>
        <Main brandingAppearance={args.brandingInfo.appearance}>
          <StateLoading {...args} />
        </Main>
      </Layout>
    </Container>

    <div style="height: 100px" />

    <Container>
      <Layout>
        <Aside brandingAppearance={args.brandingInfo.appearance}>
          <ModalHeader slot="header">
            <BrandingInfoUI {...args} />
            <IconCart />
          </ModalHeader>
          <StatePresentOffer {...args} />
        </Aside>
        <Main brandingAppearance={args.brandingInfo.appearance}>
          <StateSuccess {...args} />
        </Main>
      </Layout>
    </Container>

    <div style="height: 100px" />

    <Container>
      <Layout>
        <Aside brandingAppearance={args.brandingInfo.appearance}>
          <ModalHeader slot="header">
            <BrandingInfoUI {...args} />
            <IconCart />
          </ModalHeader>
          <StatePresentOffer {...args} />
        </Aside>
        <Main brandingAppearance={args.brandingInfo.appearance}>
          <StateError {...args} />
        </Main>
      </Layout>
    </Container>

    <div style="height: 100px" />

  </div>
</Template>


<Story name='Standard' args={{...defaultArgs,  brandingInfo:brandingInfo}} />

<Story name='Rounded' args={{...defaultArgs,   brandingInfo:{...brandingInfo, appearance:{
  shapes:'rounded',
  color_error:'blue',
  color_accent:'yellow'
} }}} />

<Story name='Pill' args={{ ...defaultArgs,   brandingInfo:{...brandingInfo, appearance:{
  shapes:'pill',
  color_error:'purple',
  color_accent:'green'
} }}} />

<Story name='Rectangle' args={{ ...defaultArgs, brandingInfo:{...brandingInfo, appearance:{
  shapes:'rectangle'
} }} } />

<Story name='CustomColorsElements' args={{ ...defaultArgs, brandingInfo:{...brandingInfo, appearance:{
  color_accent:'green',
  color_buttons_primary:'green',
  color_error:'purple',
  show_product_description:true
}}}} />

<Story name='ColorfulRectangle'
       args={{ ...defaultArgs, brandingInfo:{...brandingInfo, appearance:colorfulBrandingAppearance} }} />

<Story name='Italian' args={{...defaultArgs, selectedLocale:'it', brandingInfo:brandingInfo}} />
<Story name='it_IT' args={{...defaultArgs, selectedLocale:'it_IT', brandingInfo:brandingInfo}} />
<Story name='itDashIT' args={{...defaultArgs, selectedLocale:'it-IT', brandingInfo:brandingInfo}} />

<Story name='Spanish' args={{...defaultArgs, selectedLocale:'es', brandingInfo:brandingInfo}} />
<Story name='es_ES' args={{...defaultArgs, selectedLocale:'es_ES', brandingInfo:brandingInfo}} />
<Story name='esDashES' args={{...defaultArgs, selectedLocale:'es_ES', brandingInfo:brandingInfo}} />