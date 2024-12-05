<script lang="ts">
  import { Meta, Story, Template } from "@storybook/addon-svelte-csf";
  import StateNeedsPaymentInfo from "./utils/state-needs-payment-info-stripe-elements.svelte";
  import Layout from "../ui/layout/layout.svelte";
  import Container from "../ui/layout/container.svelte";
  import ModalBackdrop from "../ui/modal-backdrop.svelte";

  import { brandingInfo, colorfulBrandingAppearance } from "./fixtures";
  import {
    englishLocale,
    translatorContextKey,
  } from "../ui/localization/constants";
  import { Translator } from "../ui/localization/translator";
  import WithContext from "./utils/with-context.svelte";
  import { LocalizationKeys } from "../ui/localization/supportedLanguages";

  let customLabelsTranslator = new Translator(
    {
      en: {
        [LocalizationKeys.StateNeedsPaymentInfoButtonPay]: "CUSTOM LABEL",
      },
    },
    englishLocale,
  );

  let italianTranslator = new Translator({}, "it", englishLocale);
  let italianCustomLabelsTranslator = new Translator(
    {
      it: { "state_needs_payment_info.button_pay": "CUSTOM LABEL" },
    },
    "it",
    englishLocale,
  );

  let spanishTranslator = new Translator({}, "es", englishLocale);
  let spanishCustomLabelsTranslator = new Translator(
    {
      es: { "state_needs_payment_info.button_pay": "CUSTOM LABEL" },
    },
    "es",
    englishLocale,
  );
</script>

<Meta title="StateNeedsPaymentInfo" component={StateNeedsPaymentInfo} />

<Template let:args>
  <WithContext context={args.context}>
    <Container>
      <ModalBackdrop>
        <Layout>
          <StateNeedsPaymentInfo {...args} />
        </Layout>
      </ModalBackdrop>
    </Container>
  </WithContext>
</Template>

<Story name="Standard" />

<Story
  name="Rounded"
  args={{
    brandingInfo: {
      ...brandingInfo,
      appearance: {
        shapes: "rounded",
      },
    },
  }}
/>

<Story
  name="Pill"
  args={{
    brandingInfo: {
      ...brandingInfo,
      appearance: {
        shapes: "pill",
      },
    },
  }}
/>

<Story
  name="Rectangle"
  args={{
    brandingInfo: {
      ...brandingInfo,
      appearance: {
        shapes: "rectangle",
      },
    },
  }}
/>

<Story
  name="ColorfulRectangle"
  args={{
    brandingInfo: { ...brandingInfo, appearance: colorfulBrandingAppearance },
  }}
/>

<Story
  name="Italian"
  args={{
    context: { [translatorContextKey]: italianTranslator },
  }}
/>

<Story
  name="Spanish"
  args={{
    context: { [translatorContextKey]: spanishTranslator },
  }}
/>

<Story
  name="CustomLabels"
  args={{
    context: { [translatorContextKey]: customLabelsTranslator },
  }}
/>

<Story
  name="CustomLabelsIT"
  args={{
    context: { [translatorContextKey]: italianCustomLabelsTranslator },
  }}
/>

<Story
  name="CustomLabelsES"
  args={{
    context: { [translatorContextKey]: spanishCustomLabelsTranslator },
  }}
/>
