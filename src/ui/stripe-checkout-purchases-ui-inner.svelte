<script lang="ts">
  import SuccessPage from "./pages/success-page.svelte";
  import ErrorPage from "./pages/error-page.svelte";
  import StripeCheckoutPage from "./pages/stripe-checkout-page.svelte";
  import FullscreenTemplate from "./layout/fullscreen-template.svelte";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import type { Product } from "../main";
  import { PurchaseFlowError } from "../helpers/purchase-operation-helper";
  import Typography from "./atoms/typography.svelte";
  import Spinner from "./atoms/spinner.svelte";
  import { LocalizationKeys } from "./localization/supportedLanguages";
  import { getContext } from "svelte";
  import { translatorContextKey } from "./localization/constants";
  import { Translator } from "./localization/translator";
  import { type Writable } from "svelte/store";
  import ColLayout from "./layout/col-layout.svelte";
  import type { StripeBillingParams } from "../networking/responses/checkout-start-response";
  import type { BrandingAppearance } from "../entities/branding";

  interface Props {
    currentPage: "loading" | "stripe-checkout" | "success" | "error";
    brandingInfo: BrandingInfoResponse | null;
    brandingAppearance: BrandingAppearance | null;
    productDetails: Product;
    isSandbox: boolean;
    lastError: PurchaseFlowError | null;
    isInElement: boolean;
    stripeBillingParams: StripeBillingParams;
    onContinue: () => void;
    onError: (error: PurchaseFlowError) => void;
    closeWithError: () => void;
  }

  const {
    currentPage,
    brandingInfo,
    brandingAppearance,
    productDetails,
    isSandbox,
    lastError,
    isInElement,
    stripeBillingParams,
    onContinue,
    onError,
    closeWithError,
  }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);
</script>

<FullscreenTemplate
  {brandingInfo}
  {brandingAppearance}
  {isInElement}
  {isSandbox}
>
  {#snippet mainContent()}
    {#if currentPage === "stripe-checkout"}
      <div class="stripe-checkout-wrapper" class:fullscreen={!isInElement}>
        <StripeCheckoutPage {stripeBillingParams} {onContinue} {onError} />
      </div>
    {:else if currentPage === "loading"}
      <div class="rcb-ui-loading-container">
        <ColLayout gap="medium" align="center">
          <Spinner color="var(--rc-color-grey-text-dark)" />
          <Typography size="heading-md"
            >{$translator.translate(
              LocalizationKeys.LoadingPageProcessingPayment,
            )}</Typography
          >

          <Typography size="body-small"
            >{$translator.translate(
              LocalizationKeys.LoadingPageKeepPageOpen,
            )}</Typography
          ></ColLayout
        >
      </div>
    {:else if currentPage === "success"}
      <SuccessPage {onContinue} fullWidth={true} />
    {:else if currentPage === "error"}
      <ErrorPage
        {lastError}
        {productDetails}
        supportEmail={brandingInfo?.support_email ?? null}
        onDismiss={closeWithError}
        appName={brandingInfo?.app_name ?? null}
        fullWidth={true}
      />
    {/if}
  {/snippet}
</FullscreenTemplate>

<style>
  .rcb-ui-loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stripe-checkout-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden auto;
  }

  .stripe-checkout-wrapper.fullscreen {
    position: fixed;
    inset: 0;
    z-index: 1000001;
    overscroll-behavior: none;
  }
</style>
