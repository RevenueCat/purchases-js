<script>
  import { Meta, Story, Template } from "@storybook/addon-svelte-csf";
  import StateNeedsPaymentInfo from "../ui/states/state-needs-payment-info.svelte";
  import StateNeedsAuthInfo from "../ui/states/state-needs-auth-info.svelte";
  import StatePresentOffer from "../ui/states/state-present-offer.svelte";
  import StateSuccess from "../ui/states/state-success.svelte";
  import StateError from "../ui/states/state-error.svelte";
  import StateLoading from "../ui/states/state-loading.svelte";

  import Shell from "../ui/shell.svelte";
  import { toStyleVar } from "../helpers/process-style-overrides.ts";
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

    <Container style={toStyleVar(args?.brandingAppearance)}>
      <Layout>
        <Aside>
          <Shell dark>
            <ModalHeader slot="header">
              <BrandingInfoUI {...args} />
              <IconCart />
            </ModalHeader>
            <StatePresentOffer {...args} />
          </Shell>
        </Aside>
        <Main>
          <Shell>
            <StateNeedsAuthInfo {...args} />
          </Shell>
        </Main>
      </Layout>
    </Container>

    <div style="height: 100px" />

    <Container style={toStyleVar(args?.brandingAppearance)}>
      <Layout>
        <Aside>
          <Shell dark>
            <ModalHeader slot="header">
              <BrandingInfoUI {...args} />
              <IconCart />
            </ModalHeader>
            <StatePresentOffer {...args} />
          </Shell>
        </Aside>
        <Main>
          <Shell>
            <StateNeedsPaymentInfo {...args} />
          </Shell>
        </Main>
      </Layout>
    </Container>

    <div style="height: 100px" />

    <Container style={toStyleVar(args?.brandingAppearance)}>
      <Layout>
        <Aside>
          <Shell dark>
            <ModalHeader slot="header">
              <BrandingInfoUI {...args} />
              <IconCart />
            </ModalHeader>
            <StatePresentOffer {...args} />
          </Shell>
        </Aside>
        <Main>
          <Shell>
            <StateLoading {...args} />
          </Shell>
        </Main>
      </Layout>
    </Container>

    <div style="height: 100px" />

    <Container style={toStyleVar(args?.brandingAppearance)}>
      <Layout>
        <Aside>
          <Shell dark>
            <ModalHeader slot="header">
              <BrandingInfoUI {...args} />
              <IconCart />
            </ModalHeader>
            <StatePresentOffer {...args} />
          </Shell>
        </Aside>
        <Main>
          <Shell>
            <StateSuccess {...args} />
          </Shell>
        </Main>
      </Layout>
    </Container>

    <div style="height: 100px" />

    <Container style={toStyleVar(args?.brandingAppearance)}>
      <Layout>
        <Aside>
          <Shell dark>
            <ModalHeader slot="header">
              <BrandingInfoUI {...args} />
              <IconCart />
            </ModalHeader>
            <StatePresentOffer {...args} />
          </Shell>
        </Aside>
        <Main>
          <Shell>
            <StateError {...args} />
          </Shell>
        </Main>
      </Layout>
    </Container>

    <div style="height: 100px" />

  </div>
</Template>


<Story name='Standard' args={{...defaultArgs, brandingAppearance:{} }} />

<Story name='Rounded' args={{...defaultArgs,  brandingAppearance:{
  shapes:'rounded',
  color_error:'blue',
  color_accent:'yellow'
} }} />

<Story name='Pill' args={{ ...defaultArgs,  brandingAppearance:{
  shapes:'pill',
  color_error:'purple',
  color_accent:'green'
} }} />

<Story name='Rectangle' args={{ ...defaultArgs, brandingAppearance:{
  shapes:'rectangle'
} }} />

<Story name='CustomColorsElements' args={{ ...defaultArgs, brandingAppearance:{
  color_accent:'green',
  color_buttons_primary:'green',
  color_error:'purple',
  show_product_description:true
} }} />

<Story name='ColorfulRectangle' args={{ ...defaultArgs, brandingAppearance:colorfulBrandingAppearance }} />