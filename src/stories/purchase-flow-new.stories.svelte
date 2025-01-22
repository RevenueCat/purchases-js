<script>
  import { Meta, Story, Template } from "@storybook/addon-svelte-csf";

  import StateNeedsPaymentInfoWithPurchaseResponse from "./utils/state-needs-payment-info-with-purchase-response.svelte";
  import StateNeedsAuthInfo from "../ui/states/state-needs-auth-info.svelte";
  import StatePresentOffer from "../ui/states/state-present-offer.svelte";
  import StateSuccess from "../ui/states/state-success.svelte";
  import StateError from "../ui/states/state-error.svelte";
  import StateLoading from "../ui/states/state-loading.svelte";

  import Layout from "../ui/layout/layout.svelte";
  import Container from "../ui/layout/container.svelte";
  import Main from "../ui/layout/main-block.svelte";
  import NavBar from "../ui/layout/navbar.svelte";
  import IconCart from "../ui/icons/icon-cart.svelte";
  import NavBarHeader from "../ui/navbar-header.svelte";
  import BrandingInfoUI from "../ui/branding-info-ui.svelte";

  import WithContext from "./utils/with-context.svelte";

  import {
    brandingInfo,
    colorfulBrandingAppearance,
    product,
    purchaseFlowError,
    subscriptionOption,
  } from "./fixtures";
  import { Translator } from "../ui/localization/translator";
  import {
    englishLocale,
    translatorContextKey,
  } from "../ui/localization/constants";

  let defaultArgs = {
    productDetails: product,
    purchaseOptionToUse: subscriptionOption,
    purchaseOption: subscriptionOption,
    brandingInfo: brandingInfo,
    lastError: purchaseFlowError,
    onContinue: () => {},
    context: {},
  };

  let customLabelsTranslator = new Translator(
    {
      en: {
        "state_present_offer.renewal_frequency": "CUSTOM LABEL {{frequency}}",
      },
    },
    englishLocale,
  );

  let italianTranslator = new Translator({}, "it", englishLocale);
  let it_ITTranslator = new Translator({}, "it_IT", englishLocale);
  let itDashITTranslator = new Translator({}, "it-IT", englishLocale);
  let italianCustomLabelsTranslator = new Translator(
    {
      it: {
        "state_present_offer.renewal_frequency": "CUSTOM LABEL {{frequency}}",
      },
    },
    "it",
    englishLocale,
  );

  let spanishTranslator = new Translator({}, "es", englishLocale);
  let es_ESTranslator = new Translator({}, "es_ES", englishLocale);
  let esDashESTranslator = new Translator({}, "es-ES", englishLocale);
  let spanishCustomLabelsTranslator = new Translator(
    {
      es: {
        "state_present_offer.renewal_frequency": "CUSTOM LABEL {{frequency}}",
      },
    },
    "es",
    englishLocale,
  );

  const labyrinthosBranding = {
    color_accent: "#B89662",
    color_buttons_primary: "#B89662",
    color_error: "#f04141",
    color_form_bg: "#FFFFFF",
    color_page_bg: "#0A2722",
    color_product_info_bg: "#465551",
    font: "default",
    shapes: "pill",
    show_product_description: true,
  };

  const iptvWebBranding = {
    color_accent: "#FF3B30",
    color_buttons_primary: "#ff3b30",
    color_error: "#F2545B",
    color_form_bg: "#1f1f1f",
    color_page_bg: "#141414",
    color_product_info_bg: "#1f1f1f",
    font: "default",
    shapes: "pill",
    show_product_description: false,
  };
</script>

<Meta title="PurchaseFlowNew" />

<Template let:args>
  <WithContext context={args.context}>
    <div
      style="background-color: rgba(40, 40, 40, 0.75); width: 100vw; min-height: 100vh;"
    >
      <Container>
        <NavBar brandingAppearance={args.brandingInfo.appearance}>
          {#snippet headerContent()}
            <BrandingInfoUI {...args} />
          {/snippet}

          {#snippet bodyContent(expanded)}
            <StatePresentOffer {...args} {expanded} />
          {/snippet}
        </NavBar>
        <Main brandingAppearance={args.brandingInfo.appearance}>
          {#snippet body()}
            <StateNeedsAuthInfo {...args} />
          {/snippet}
        </Main>
      </Container>
    </div>
  </WithContext>
</Template>

<Story name="Standard" args={{ ...defaultArgs, brandingInfo: brandingInfo }} />
