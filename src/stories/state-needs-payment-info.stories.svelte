<script lang="ts">
  import { Meta, Story, Template } from "@storybook/addon-svelte-csf";
  import StateNeedsPaymentInfo from "../ui/states/state-needs-payment-info.svelte";
  import Layout from "../ui/layout/layout.svelte";
  import Container from "../ui/layout/container.svelte";
  import Main from "../ui/layout/main-block.svelte";
  import ModalBackdrop from "../ui/modal-backdrop.svelte";

  import {
    brandingInfo,
    colorfulBrandingAppearance,
    product,
    purchaseResponse,
    subscriptionOption,
  } from "./fixtures";
  import { translatorContextKey } from "../ui/localization/constants";
  import { Translator } from "../ui/localization/translator";
  import WithContext from "./utils/with-context.svelte";

  let defaultArgs = {
    paymentInfoCollectionMetadata: purchaseResponse,
    productDetails: product,
    purchaseOptionToUse: subscriptionOption,
    onContinue: () => {},
  };

  let customLabelsTranslator = new Translator(
    {
      en: { "state_needs_payment_info.button_pay": "CUSTOM LABEL" },
    },
    "en",
  );

  let italianTranslator = new Translator({}, "it", "en");
  let italianCustomLabelsTranslator = new Translator(
    {
      it: { "state_needs_payment_info.button_pay": "CUSTOM LABEL" },
    },
    "it",
    "en",
  );

  let spanishTranslator = new Translator({}, "es", "en");
  let spanishCustomLabelsTranslator = new Translator(
    {
      es: { "state_needs_payment_info.button_pay": "CUSTOM LABEL" },
    },
    "es",
    "en",
  );
</script>

<Meta title="StateNeedsPaymentInfo" component={StateNeedsPaymentInfo} />

<Template let:args>
  <WithContext context={args.context}>
    <Container>
      <ModalBackdrop>
        <Layout>
          <Main brandingAppearance={args.brandingInfo?.appearance}>
            <StateNeedsPaymentInfo {...args} />
          </Main>
        </Layout>
      </ModalBackdrop>
    </Container>
  </WithContext>
</Template>

<Story name="Standard" args={{ ...defaultArgs }} />

<Story
  name="Rounded"
  args={{
    ...defaultArgs,
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
    ...defaultArgs,
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
    ...defaultArgs,
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
    ...defaultArgs,
    brandingInfo: { ...brandingInfo, appearance: colorfulBrandingAppearance },
  }}
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
