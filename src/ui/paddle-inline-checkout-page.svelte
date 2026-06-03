<script lang="ts">
  import Template from "./layout/template.svelte";
  import PaddleOrderSummary from "./organisms/paddle-order-summary.svelte";
  import SuccessPage from "./pages/success-page.svelte";
  import ErrorPage from "./pages/error-page.svelte";
  import Icon from "./atoms/icon.svelte";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import type { Product, PurchaseOption } from "../entities/offerings";
  import { type PriceBreakdown } from "./ui-types";
  import { PADDLE_INLINE_FRAME_TARGET } from "../paddle/paddle-service";
  import { type PurchaseFlowError } from "../helpers/purchase-operation-helper";

  interface Props {
    brandingInfo: BrandingInfoResponse | null;
    isSandbox: boolean;
    isInElement: boolean;
    onClose: () => void;
    productDetails: Product;
    purchaseOption: PurchaseOption;
    // Built from Paddle's checkout-totals events; renders the Subtotal/Tax/Total
    // breakdown in the order-summary panel (same component as Web Billing).
    priceBreakdown: PriceBreakdown;
    currentPage: "waiting" | "loading" | "success" | "error";
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
    priceBreakdown,
    currentPage,
    lastError,
    onContinue,
    closeWithError,
  }: Props = $props();

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
      {priceBreakdown}
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
</style>
