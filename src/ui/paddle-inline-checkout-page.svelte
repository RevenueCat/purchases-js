<script lang="ts">
  import FullscreenTemplate from "./layout/fullscreen-template.svelte";
  import BrandingHeader from "./molecules/branding-header.svelte";
  import ProductInfo from "./organisms/product-info.svelte";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import type { Product, PurchaseOption } from "../entities/offerings";
  import { getInitialPriceFromPurchaseOption } from "../helpers/purchase-option-price-helper";
  import { type PriceBreakdown } from "./ui-types";
  import { PADDLE_INLINE_FRAME_TARGET } from "../paddle/paddle-service";

  interface Props {
    brandingInfo: BrandingInfoResponse | null;
    isSandbox: boolean;
    isInElement: boolean;
    onClose: () => void;
    productDetails: Product;
    purchaseOption: PurchaseOption;
  }

  const {
    brandingInfo,
    isSandbox,
    isInElement,
    onClose,
    productDetails,
    purchaseOption,
  }: Props = $props();

  // Paddle's iframe shows the authoritative totals; the product-info panel
  // mirrors the Web Billing / Stripe layout using the option's initial price.
  const initialPrice = getInitialPriceFromPurchaseOption(
    productDetails,
    purchaseOption,
  );
  const priceBreakdown: PriceBreakdown = {
    currency: initialPrice.currency,
    totalAmountInMicros: initialPrice.amountMicros,
    totalExcludingTaxInMicros: initialPrice.amountMicros,
    taxCalculationStatus: "unavailable",
    taxAmountInMicros: null,
    taxBreakdown: null,
  };
</script>

<FullscreenTemplate {brandingInfo} {isInElement} {isSandbox}>
  {#snippet mainContent()}
    <div class="rcb-paddle-inline-checkout">
      {#if !isInElement}
        <!-- Inline checkout has no Paddle-provided dismiss (unlike the overlay
             modal), so render our own branded header with a back/close button. -->
        <BrandingHeader {brandingInfo} {onClose} showCloseButton={true} />
      {/if}
      <ProductInfo
        {productDetails}
        {purchaseOption}
        showProductDescription={brandingInfo?.appearance
          ?.show_product_description ?? false}
        {priceBreakdown}
      />
      <!-- Paddle injects its inline checkout iframe into this container (its
           frameTarget className). The element must already exist in the DOM when
           PaddleService.purchase() calls Paddle.Checkout.open(). -->
      <div
        class={PADDLE_INLINE_FRAME_TARGET}
        data-testid="paddle-inline-checkout-container"
        style="width: 100%; min-height: 450px;"
      ></div>
    </div>
  {/snippet}
</FullscreenTemplate>

<style>
  .rcb-paddle-inline-checkout {
    width: 100%;
    max-width: 768px;
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapLarge-mobile, 16px);
  }
</style>
