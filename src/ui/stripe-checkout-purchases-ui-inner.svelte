<script lang="ts">
  import SuccessPage from "./pages/success-page.svelte";
  import ErrorPage from "./pages/error-page.svelte";
  import StripeCheckoutPage from "./pages/stripe-checkout-page.svelte";
  import FullscreenTemplate from "./layout/fullscreen-template.svelte";
  import Template from "./layout/template.svelte";
  import BrandingHeader from "./molecules/branding-header.svelte";
  import UpgradeConfirmPage from "./pages/upgrade-confirm-page.svelte";
  import UpgradeProductInfo from "./organisms/upgrade-product-info.svelte";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import type { BrandingAppearance, Product, PurchaseOption } from "../main";
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
  import type { SubscriptionChangeCheckoutStartResponse } from "../networking/responses/subscription-change-response";
  import { Theme } from "./theme/theme";
  import { toProductInfoColors } from "./theme/utils";
  import { brandingContextKey } from "./constants";

  interface Props {
    currentPage:
      | "loading"
      | "stripe-checkout"
      | "success"
      | "error"
      | "purchasing"
      | "upgrade-confirm";
    brandingInfo: BrandingInfoResponse | null;
    productDetails: Product;
    isSandbox: boolean;
    lastError: PurchaseFlowError | null;
    isInElement: boolean;
    stripeBillingParams: StripeBillingParams | null;
    purchaseOptionToUse: PurchaseOption;
    subscriptionChangeStartData: SubscriptionChangeCheckoutStartResponse | null;
    isConfirmingProductChange: boolean;
    productChangeConfirmError: string | null;
    onConfirmProductChange: () => void;
    onContinue: () => void;
    onError: (error: PurchaseFlowError) => void;
    onClose?: () => void;
    closeWithError: () => void;
    hideBackButton?: boolean;
  }

  const {
    currentPage,
    brandingInfo,
    productDetails,
    isSandbox,
    lastError,
    isInElement,
    stripeBillingParams,
    purchaseOptionToUse,
    subscriptionChangeStartData,
    isConfirmingProductChange,
    productChangeConfirmError,
    onConfirmProductChange,
    onContinue,
    onError,
    onClose = undefined,
    closeWithError,
    hideBackButton = false,
  }: Props = $props();

  const brandingAppearanceStore =
    getContext<Writable<BrandingAppearance | null | undefined>>(
      brandingContextKey,
    );
  const derivedBrandingAppearance = $derived(
    $brandingAppearanceStore ?? undefined,
  );

  const colorVariables = $derived(
    new Theme(derivedBrandingAppearance).pageStyleVars,
  );
  const productInfoBg = $derived(
    toProductInfoColors(derivedBrandingAppearance).background,
  );

  const translator: Writable<Translator> = getContext(translatorContextKey);
</script>

{#if currentPage === "upgrade-confirm" && subscriptionChangeStartData}
  <Template {brandingInfo} {isInElement} {isSandbox} {onClose}>
    {#snippet navbarHeaderContent()}
      <BrandingHeader
        {brandingInfo}
        {onClose}
        showCloseButton={!isInElement && !!onClose && !hideBackButton}
      />
    {/snippet}
    {#snippet navbarBodyContent()}
      <UpgradeProductInfo
        startData={subscriptionChangeStartData}
        unusedTimeAdjustmentVariant="credit"
        unresolvedTaxCalculationStatus="disabled"
      />
    {/snippet}
    {#snippet mainContent()}
      <UpgradeConfirmPage
        startData={subscriptionChangeStartData}
        confirming={isConfirmingProductChange}
        confirmError={productChangeConfirmError}
        brandingAppearance={derivedBrandingAppearance}
        {brandingInfo}
        purchaseOption={purchaseOptionToUse}
        onConfirm={onConfirmProductChange}
      />
    {/snippet}
  </Template>
{:else}
  <FullscreenTemplate {brandingInfo} {isInElement} {isSandbox}>
    {#snippet mainContent()}
      {#if currentPage === "stripe-checkout"}
        {#if stripeBillingParams}
          <div
            class="stripe-checkout-wrapper"
            style="{colorVariables}; background-color: {productInfoBg}"
          >
            <StripeCheckoutPage {stripeBillingParams} {onContinue} {onError} />
          </div>
        {/if}
      {:else if currentPage === "loading" || currentPage === "purchasing"}
        <div class="rcb-ui-loading-container">
          <ColLayout gap="medium" align="center">
            <Spinner color="var(--rc-color-grey-text-dark)" />
            {#if currentPage === "purchasing"}
              <Typography size="heading-md"
                >{$translator.translate(
                  LocalizationKeys.LoadingPageProcessingPayment,
                )}</Typography
              >

              <Typography size="body-small"
                >{$translator.translate(
                  LocalizationKeys.LoadingPageKeepPageOpen,
                )}</Typography
              >
            {/if}
          </ColLayout>
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
{/if}

<style>
  .rcb-ui-loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stripe-checkout-wrapper {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden auto;
  }

  /* 991px is the breakpoint for the mobile layout in Stripe Checkout */
  @media (min-width: 991px) {
    .stripe-checkout-wrapper {
      justify-content: center;
      align-items: center;
    }
  }
</style>
