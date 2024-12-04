<script>
  import { Meta, Story, Template } from "@storybook/addon-svelte-csf";
  import StatePresentOffer from "../ui/states/state-present-offer.svelte";
  import SandboxBanner from "../ui/sandbox-banner.svelte";
  import Layout from "../ui/layout/layout.svelte";
  import Container from "../ui/layout/container.svelte";
  import Aside from "../ui/layout/aside-block.svelte";
  import ModalBackdrop from "../ui/modal-backdrop.svelte";
  import {
    brandingInfo,
    colorfulBrandingAppearance,
    product,
    subscriptionOption,
    subscriptionOptionWithTrial,
  } from "./fixtures";
  import IconCart from "../ui/icons/icon-cart.svelte";
  import ModalHeader from "../ui/modal-header.svelte";
  import BrandingInfoUI from "../ui/branding-info-ui.svelte";
  import WithContext from "./utils/with-context.svelte";
  import { Translator } from "../ui/localization/translator";
  import {
    englishLocale,
    translatorContextKey,
  } from "../ui/localization/constants";

  let defaultArgs = {
    productDetails: product,
    purchaseOption: subscriptionOption,
    brandingInfo: brandingInfo,
    sandbox: false,
    context: {},
  };

  let customLabelsTranslator = new Translator(
    {
      en: { "state_present_offer.renewal_frequency": "CUSTOM LABEL" },
    },
    englishLocale,
  );

  let italianTranslator = new Translator({}, "it", englishLocale);
  let italianCustomLabelsTranslator = new Translator(
    {
      it: { "state_present_offer.renewal_frequency": "CUSTOM LABEL" },
    },
    "it",
    englishLocale,
  );

  let spanishTranslator = new Translator({}, "es", englishLocale);
  let spanishCustomLabelsTranslator = new Translator(
    {
      es: { "state_present_offer.renewal_frequency": "CUSTOM LABEL" },
    },
    "es",
    englishLocale,
  );
</script>

<Meta title="StatePresentsOffer" component={StatePresentOffer} />

<Template let:args>
  <WithContext context={args.context}>
    <Container>
      <ModalBackdrop>
        <Layout>
          <Aside brandingAppearance={args.brandingAppearance}>
            <ModalHeader slot="header">
              <BrandingInfoUI {...args} />
              {#if args.sandbox}
                <SandboxBanner />
              {:else}
                <IconCart />
              {/if}
            </ModalHeader>
            <StatePresentOffer {...args} />
          </Aside>
        </Layout>
      </ModalBackdrop>
    </Container>
  </WithContext>
</Template>

<Story name="Standard" args={{ ...defaultArgs, brandingAppearance: {} }} />

<Story
  name="Rounded"
  args={{
    ...defaultArgs,
    brandingAppearance: {
      shapes: "rounded",
    },
  }}
/>

<Story
  name="Pill"
  args={{
    ...defaultArgs,
    brandingAppearance: {
      shapes: "pill",
    },
  }}
/>

<Story
  name="Rectangle"
  args={{
    ...defaultArgs,
    brandingAppearance: {
      shapes: "rectangle",
    },
  }}
/>

<Story
  name="ColorfulRectangle"
  args={{ ...defaultArgs, brandingAppearance: colorfulBrandingAppearance }}
/>

<Story
  name="Sandbox"
  args={{ ...defaultArgs, sandbox: true, brandingAppearance: {} }}
/>

<Story
  name="WithProductDescription"
  args={{
    ...defaultArgs,
    brandingAppearance: { show_product_description: true },
  }}
/>

<Story
  name="WithProductDescriptionInverted"
  args={{
    ...defaultArgs,
    brandingAppearance: {
      color_product_info_bg: "#ffffff",
      show_product_description: true,
    },
  }}
/>

<Story
  name="WithProductDescriptionTrials"
  args={{ ...defaultArgs, purchaseOption: subscriptionOptionWithTrial }}
/>

<Story
  name="WithProductDescriptionNullDescription"
  args={{
    ...defaultArgs,
    productDetails: { ...product, description: null },
    brandingAppearance: { show_product_description: true },
  }}
/>

<Story
  name="Italian"
  args={{
    ...defaultArgs,
    context: { [translatorContextKey]: italianTranslator },
    purchaseOption: subscriptionOptionWithTrial,
  }}
/>

<Story
  name="Spanish"
  args={{
    ...defaultArgs,
    context: { [translatorContextKey]: spanishTranslator },
  }}
/>

<Story
  name="CustomLabels"
  args={{
    ...defaultArgs,
    context: { [translatorContextKey]: customLabelsTranslator },
    productDetails: { ...product, description: null },
  }}
/>

<Story
  name="CustomLabelsIT"
  args={{
    ...defaultArgs,

    context: { [translatorContextKey]: italianCustomLabelsTranslator },
    productDetails: { ...product, description: null },
  }}
/>

<Story
  name="CustomLabelsES"
  args={{
    ...defaultArgs,

    context: { [translatorContextKey]: spanishCustomLabelsTranslator },
    productDetails: { ...product, description: null },
  }}
/>
