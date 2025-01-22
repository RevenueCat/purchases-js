<script>
  import { Meta, Story, Template } from "@storybook/addon-svelte-csf";
  import StatePresentOffer from "../ui/states/state-present-offer.svelte";
  import SandboxBanner from "../ui/sandbox-banner.svelte";
  import Layout from "../ui/layout/layout.svelte";
  import Container from "../ui/layout/container.svelte";
  import NavBar from "../ui/layout/navbar.svelte";
  import ModalBackdrop from "../ui/modal-backdrop.svelte";
  import {
    brandingInfo,
    colorfulBrandingAppearance,
    product,
    subscriptionOption,
    subscriptionOptionWithTrial,
  } from "./fixtures";
  import IconCart from "../ui/icons/icon-cart.svelte";
  import NavBarHeader from "../ui/navbar-header.svelte";
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

  const priceJPY = {
    currency: "JPY",
    amount: 1000,
    amountMicros: 1000000000,
    formattedPrice: "¥1,000",
  };

  const priceEUR = {
    currency: "EUR",
    amount: 10,
    amountMicros: 10000000,
    formattedPrice: "€10.00",
  };

  const priceGBP = {
    currency: "GBP",
    amount: 10,
    amountMicros: 10000000,
    formattedPrice: "£10.00",
  };

  const priceCAD = {
    currency: "CAD",
    amount: 10,
    amountMicros: 10000000,
    formattedPrice: "CA$10.00",
  };
</script>

<Meta title="StatePresentsOffer" component={StatePresentOffer} />

<Template let:args>
  <WithContext context={args.context}>
    <Container>
      <ModalBackdrop>
        <Layout>
          <NavBar brandingAppearance={args.brandingAppearance}>
            {#snippet headerContent()}
              <BrandingInfoUI {...args} />
              {#if args.sandbox}
                <SandboxBanner />
              {:else}
                <IconCart />
              {/if}
            {/snippet}

            {#snippet bodyContent(expanded)}
              <StatePresentOffer {...args} {expanded} />
            {/snippet}
          </NavBar>
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

<Story
  name="Price JPY"
  args={{
    ...defaultArgs,
    purchaseOption: {
      ...subscriptionOption,
      base: { ...subscriptionOption.base, price: priceJPY },
    },
  }}
/>

<Story
  name="Price JPY Spanish"
  args={{
    ...defaultArgs,
    purchaseOption: {
      ...subscriptionOption,
      base: { ...subscriptionOption.base, price: priceJPY },
    },
    context: { [translatorContextKey]: spanishTranslator },
  }}
/>

<Story
  name="Price EUR"
  args={{
    ...defaultArgs,
    purchaseOption: {
      ...subscriptionOption,
      base: { ...subscriptionOption.base, price: priceEUR },
    },
  }}
/>

<Story
  name="Price EUR Spanish"
  args={{
    ...defaultArgs,
    purchaseOption: {
      ...subscriptionOption,
      base: { ...subscriptionOption.base, price: priceEUR },
    },
    context: { [translatorContextKey]: spanishTranslator },
  }}
/>

<Story
  name="Price CAD"
  args={{
    ...defaultArgs,
    purchaseOption: {
      ...subscriptionOption,
      base: { ...subscriptionOption.base, price: priceCAD },
    },
  }}
/>

<Story
  name="Price GBP"
  args={{
    ...defaultArgs,
    purchaseOption: {
      ...subscriptionOption,
      base: { ...subscriptionOption.base, price: priceGBP },
    },
  }}
/>
