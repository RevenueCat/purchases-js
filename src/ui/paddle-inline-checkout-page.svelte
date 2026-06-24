<script lang="ts">
  import { getContext } from "svelte";
  import { type Writable } from "svelte/store";
  import Template from "./layout/template.svelte";
  import PaddleOrderSummary from "./organisms/paddle-order-summary.svelte";
  import SuccessPage from "./pages/success-page.svelte";
  import ErrorPage from "./pages/error-page.svelte";
  import Icon from "./atoms/icon.svelte";
  import Spinner from "./atoms/spinner.svelte";
  import Typography from "./atoms/typography.svelte";
  import ColLayout from "./layout/col-layout.svelte";
  import { translatorContextKey } from "./localization/constants";
  import { Translator } from "./localization/translator";
  import { LocalizationKeys } from "./localization/supportedLanguages";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import type { Product, PurchaseOption } from "../entities/offerings";
  import {
    PADDLE_INLINE_FRAME_TARGET,
    type PaddleCheckoutTotals,
  } from "../paddle/paddle-service";
  import { type PurchaseFlowError } from "../helpers/purchase-operation-helper";

  interface Props {
    brandingInfo: BrandingInfoResponse | null;
    isSandbox: boolean;
    isInElement: boolean;
    onClose: () => void;
    hideBackButton?: boolean;
    productDetails: Product;
    purchaseOption: PurchaseOption;
    // Live order totals from Paddle's checkout events; render the order summary.
    totals: PaddleCheckoutTotals | null;
    currentPage: "waiting" | "loading" | "success" | "error";
    checkoutCompleted: boolean;
    lastError: PurchaseFlowError | null;
    onContinue: () => void;
    closeWithError: () => void;
  }

  const {
    brandingInfo,
    isSandbox,
    isInElement,
    onClose,
    productDetails,
    purchaseOption,
    totals,
    currentPage,
    checkoutCompleted,
    lastError,
    onContinue,
    closeWithError,
  }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const appName = brandingInfo?.app_name ?? null;
</script>

<Template {brandingInfo} {isInElement} {isSandbox} {onClose}>
  {#snippet navbarHeaderContent()}
    {#if !isInElement}
      <!-- Inline checkout embeds Paddle's iframe in our page, so we provide the
           back affordance (Paddle's own "Return to <seller>" link only exists in
           the overlay/hosted checkout, not inline). -->
      <button
        type="button"
        class="rcb-paddle-return-button"
        data-testid="paddle-return-button"
        onclick={onClose}
      >
        <Icon name="back" />
        <span>{appName ? `Return to ${appName}` : "Back"}</span>
      </button>
    {/if}
  {/snippet}
  {#snippet navbarBodyContent()}
    <PaddleOrderSummary
      {brandingInfo}
      {productDetails}
      {purchaseOption}
      {totals}
    />
  {/snippet}
  {#snippet mainContent()}
    {#if currentPage === "success"}
      <SuccessPage {onContinue} />
    {:else if currentPage === "error"}
      <ErrorPage
        {lastError}
        {productDetails}
        supportEmail={brandingInfo?.support_email ?? null}
        onDismiss={closeWithError}
        appName={brandingInfo?.app_name ?? null}
      />
    {:else if checkoutCompleted}
      <!-- Paddle reported completion; show a processing state while we poll the
           backend for the final status (the checkout iframe is gone by now). -->
      <div class="rcb-paddle-processing">
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
          >
        </ColLayout>
      </div>
    {:else}
      <!-- Paddle injects its inline checkout iframe into this container (its
           frameTarget className). The element must already exist in the DOM when
           PaddleService.purchase() calls Paddle.Checkout.open(). -->
      <div
        class={PADDLE_INLINE_FRAME_TARGET}
        data-testid="paddle-inline-checkout-container"
        style="width: 100%; min-height: 450px;"
      ></div>
    {/if}
  {/snippet}
</Template>

<style>
  .rcb-paddle-return-button {
    display: inline-flex;
    align-items: center;
    gap: var(--rc-spacing-gapSmall-mobile, 8px);
    padding: 8px 0;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--rc-color-accent);
    font: inherit;
  }

  .rcb-paddle-processing {
    display: flex;
    justify-content: center;
    width: 100%;
    min-height: 450px;
    align-items: center;
  }
</style>
