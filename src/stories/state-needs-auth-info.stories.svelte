<script>
  import { Meta, Story, Template } from "@storybook/addon-svelte-csf";
  import StateNeedsAuthInfo from "../ui/states/state-needs-auth-info.svelte";
  import Layout from "../ui/layout/layout.svelte";
  import Container from "../ui/layout/container.svelte";
  import Main from "../ui/layout/main-block.svelte";
  import ModalBackdrop from "../ui/modal-backdrop.svelte";

  import {
    brandingInfo,
    colorfulBrandingAppearance,
    product,
    subscriptionOption,
  } from "./fixtures";
  import {
    englishLocale,
    translatorContextKey,
  } from "../ui/localization/constants";
  import { Translator } from "../ui/localization/translator";
  import WithContext from "./utils/with-context.svelte";

  let defaultArgs = {
    productDetails: product,
    purchaseOption: subscriptionOption,
    brandingInfo: brandingInfo,
  };

  let customLabelsTranslator = new Translator(
    {
      en: { "state_needs_auth_info.button_continue": "CUSTOM LABEL" },
    },
    englishLocale,
  );

  let italianTranslator = new Translator({}, "it", englishLocale);
  let italianCustomLabelsTranslator = new Translator(
    {
      it: { "state_needs_auth_info.button_continue": "CUSTOM LABEL" },
    },
    "it",
    englishLocale,
  );

  let spanishTranslator = new Translator({}, "es", englishLocale);
  let spanishCustomLabelsTranslator = new Translator(
    {
      es: { "state_needs_auth_info.button_continue": "CUSTOM LABEL" },
    },
    "es",
    englishLocale,
  );
</script>

<Meta title="StateNeedsAuthInfo" component={StateNeedsAuthInfo} />

<Template let:args>
  <WithContext context={args.context}>
    <Container>
      <ModalBackdrop>
        <Layout>
          <Main brandingAppearance={args.brandingAppearance}>
            <StateNeedsAuthInfo {...args} />
          </Main>
        </Layout>
      </ModalBackdrop>
    </Container>
  </WithContext>
</Template>

<Story name="Standard" args={{ ...defaultArgs, brandingAppearance: {} }} />

<Story
  name="Rounded"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOption,
    brandingAppearance: {
      shapes: "rounded",
    },
  }}
/>

<Story
  name="Pill"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOption,
    brandingAppearance: {
      shapes: "pill",
    },
  }}
/>

<Story
  name="Rectangle"
  args={{
    productDetails: product,
    purchaseOption: subscriptionOption,
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
  name="Italian"
  args={{
    ...defaultArgs,
    context: { [translatorContextKey]: italianTranslator },
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
  }}
/>

<Story
  name="CustomLabelsIT"
  args={{
    ...defaultArgs,

    context: { [translatorContextKey]: italianCustomLabelsTranslator },
  }}
/>

<Story
  name="CustomLabelsES"
  args={{
    ...defaultArgs,
    context: { [translatorContextKey]: spanishCustomLabelsTranslator },
  }}
/>
