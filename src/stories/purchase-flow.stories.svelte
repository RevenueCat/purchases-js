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

  import WithContext from "./utils/with-context.svelte";

  import {
    brandingInfo,
    colorfulBrandingAppearance,
    product,
    purchaseFlowError,
    purchaseResponse,
    subscriptionOption,
  } from "./fixtures";
  import { Translator } from "../ui/localization/translator";
  import { translatorContextKey } from "../ui/localization/constants";


  let defaultArgs = {
    paymentInfoCollectionMetadata: purchaseResponse,
    productDetails: product,
    purchaseOptionToUse: subscriptionOption,
    purchaseOption: subscriptionOption,
    brandingInfo: brandingInfo,
    lastError: purchaseFlowError,
    onContinue: () => {
    },
    context: {},
  };

  let customLabelsTranslator = new Translator({
    "en": { "state_present_offer.renewal_frequency": "CUSTOM LABEL {{frequency}}" },
  }, "en");

  let italianTranslator = new Translator({}, "it", "en");
  let it_ITTranslator = new Translator({}, "it_IT", "en");
  let itDashITTranslator = new Translator({}, "it-IT", "en");
  let italianCustomLabelsTranslator = new Translator({
    "it": { "state_present_offer.renewal_frequency": "CUSTOM LABEL {{frequency}}" },
  }, "it", "en");

  let spanishTranslator = new Translator({}, "es", "en");
  let es_ESTranslator = new Translator({}, "es_ES", "en");
  let esDashESTranslator = new Translator({}, "es-ES", "en");
  let spanishCustomLabelsTranslator = new Translator({
    "es": { "state_present_offer.renewal_frequency": "CUSTOM LABEL {{frequency}}" },
  }, "es", "en");
</script>


<Meta title="PurchaseFlow" component={StateNeedsPaymentInfo} />


<Template let:args>
  <WithContext context={args.context}>
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
  </WithContext>
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

<Story name='Italian'
       args={{...defaultArgs, context:{[translatorContextKey]:italianTranslator}, brandingInfo:brandingInfo}} />
<Story name='it_IT'
       args={{...defaultArgs, context:{[translatorContextKey]:it_ITTranslator}, brandingInfo:brandingInfo}} />
<Story name='itDashIT'
       args={{...defaultArgs,context:{[translatorContextKey]:itDashITTranslator}, brandingInfo:brandingInfo}} />

<Story name='Spanish'
       args={{...defaultArgs, context:{[translatorContextKey]:spanishTranslator}, brandingInfo:brandingInfo}} />
<Story name='es_ES'
       args={{...defaultArgs, context:{[translatorContextKey]:es_ESTranslator}, brandingInfo:brandingInfo}} />
<Story name='esDashES'
       args={{...defaultArgs, context:{[translatorContextKey]:esDashESTranslator}, brandingInfo:brandingInfo}} />


<Story name='CustomLabels'
       args={{...defaultArgs, context:{[translatorContextKey]:customLabelsTranslator}, brandingInfo:brandingInfo}} />

<Story name='CustomLabelsIT'
       args={{...defaultArgs, context:{[translatorContextKey]:italianCustomLabelsTranslator}, brandingInfo:brandingInfo}} />

<Story name='CustomLabelsES'
       args={{...defaultArgs, context:{[translatorContextKey]:spanishCustomLabelsTranslator}, brandingInfo:brandingInfo}} />


<!-- TODO: Add stories for non subscription products -->

<!-- TODO: Add stories for non subscriptions with trials -->
