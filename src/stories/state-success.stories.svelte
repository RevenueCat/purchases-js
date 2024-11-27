<script>
  import { Meta, Story, Template } from "@storybook/addon-svelte-csf";
  import StateSuccess from "../ui/states/state-success.svelte";
  import Layout from "../ui/layout/layout.svelte";
  import Container from "../ui/layout/container.svelte";
  import Main from "../ui/layout/main-block.svelte";
  import ModalBackdrop from "../ui/modal-backdrop.svelte";
  import { brandingInfo, colorfulBrandingAppearance, product, subscriptionOption } from "./fixtures";
  import { Translator } from "../ui/localization/translator";
  import { translatorContextKey } from "../ui/localization/constants";
  import WithContext from "./utils/with-context.svelte";

  let defaultArgs = {
    productDetails: product, purchaseOption: subscriptionOption, brandingInfo: brandingInfo,
  };

  let customLabelsTranslator = new Translator({
    "en": { "state_present_offer.renewal_frequency": "CUSTOM LABEL" },
  }, "en");

  let italianTranslator = new Translator({}, "it", "en");
  let italianCustomLabelsTranslator = new Translator({
    "it": { "state_present_offer.renewal_frequency": "CUSTOM LABEL" },
  }, "it", "en");

  let spanishTranslator = new Translator({}, "es", "en");
  let spanishCustomLabelsTranslator = new Translator({
    "es": { "state_present_offer.renewal_frequency": "CUSTOM LABEL" },
  }, "es", "en");
</script>


<Meta title="StateSuccess" component={StateSuccess} />


<Template let:args>
  <WithContext context={args.context}>
    <Container>
      <ModalBackdrop>
        <Layout>
          <Main brandingAppearance={args.brandingAppearance}>
            <StateSuccess {...args} />
          </Main>
        </Layout>
      </ModalBackdrop>
    </Container>
  </WithContext>
</Template>

<Story name='Standard' args={defaultArgs} />

<Story name='Rounded' args={{ ...defaultArgs,brandingAppearance:{
  shapes:'rounded'
} }} />

<Story name='Pill' args={{...defaultArgs, brandingAppearance:{
  shapes:'pill'
} }} />

<Story name='Rectangle' args={{ ...defaultArgs, brandingAppearance:{
  shapes:'rectangle'
} }} />

<Story name='ColorfulRectangle'
       args={{ ...defaultArgs,  brandingAppearance:colorfulBrandingAppearance }} />

<Story name='Italian'
       args={{ ...defaultArgs,
       context:{[translatorContextKey]: italianTranslator},
       }}
/>

<Story name='Spanish'
       args={{
         ...defaultArgs,
         context:{[translatorContextKey]: spanishTranslator},
      }}
/>


<Story name='CustomLabels'
       args={{ ...defaultArgs,
        context:{[translatorContextKey]: customLabelsTranslator},
          }}
/>


<Story name='CustomLabelsIT'
       args={{ ...defaultArgs,

       context:{[translatorContextKey]: italianCustomLabelsTranslator},
           }}
/>

<Story name='CustomLabelsES'
       args={{ ...defaultArgs,

       context:{[translatorContextKey]: spanishCustomLabelsTranslator},
         }}
/>