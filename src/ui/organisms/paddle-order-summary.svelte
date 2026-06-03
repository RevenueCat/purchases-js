<script lang="ts">
  import { getContext } from "svelte";
  import { type Writable } from "svelte/store";
  import ProductHeader from "../molecules/product-header.svelte";
  import PricingTable from "../molecules/pricing-table.svelte";
  import Typography from "../atoms/typography.svelte";
  import { Theme } from "../theme/theme";
  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";
  import type { BrandingInfoResponse } from "../../networking/responses/branding-response";
  import {
    type Product,
    type PurchaseOption,
    type SubscriptionOption,
    type NonSubscriptionOption,
    type PricingPhase,
  } from "../../entities/offerings";
  import { type PriceBreakdown } from "../ui-types";

  interface Props {
    brandingInfo: BrandingInfoResponse | null;
    productDetails: Product;
    purchaseOption: PurchaseOption;
    priceBreakdown: PriceBreakdown;
  }

  const {
    brandingInfo,
    productDetails,
    purchaseOption,
    priceBreakdown,
  }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  // Card chrome comes from the same branding/appearance config the rest of the
  // checkout uses: the form background for the cards, the shape preset for the
  // corner radius. The amount uses the primary (buttons) color.
  const theme = new Theme(brandingInfo?.appearance ?? null);
  const cardBackground = theme.formColors.background;
  const cardRadius = theme.shape["input-border-radius"];

  const isSubscription = productDetails.productType === "subscription";
  const subscriptionOption = isSubscription
    ? (purchaseOption as SubscriptionOption)
    : null;
  const nonSubscriptionOption = !isSubscription
    ? (purchaseOption as NonSubscriptionOption)
    : null;
  const basePhase: PricingPhase | null = isSubscription
    ? (subscriptionOption?.base ?? null)
    : nonSubscriptionOption?.basePrice
      ? {
          periodDuration: null,
          period: null,
          cycleCount: 1,
          price: nonSubscriptionOption.basePrice,
          pricePerWeek: null,
          pricePerMonth: null,
          pricePerYear: null,
        }
      : null;
  const trialPhase = subscriptionOption?.trial ?? null;
</script>

<div
  class="rcb-paddle-summary"
  style="--rcb-card-bg: {cardBackground}; --rcb-card-radius: {cardRadius};"
>
  <div class="rcb-paddle-summary-card">
    <div class="rcb-paddle-summary-amount">
      {$translator.formatPrice(
        priceBreakdown.totalAmountInMicros,
        priceBreakdown.currency,
      )}
    </div>
    <ProductHeader
      {productDetails}
      showProductDescription={brandingInfo?.appearance
        ?.show_product_description ?? false}
    />
    {#if basePhase?.period}
      <Typography size="body-small">
        {$translator.translatePeriodFrequency(
          basePhase.period.number,
          basePhase.period.unit,
        )}
      </Typography>
    {/if}
  </div>

  <div class="rcb-paddle-summary-card">
    <PricingTable
      {priceBreakdown}
      {trialPhase}
      {basePhase}
      promotionalPricePhase={null}
      hasDiscount={false}
      showDiscountCodeField={false}
      discountCode=""
      appliedDiscountCode={null}
      appliedDiscountPercentage={null}
      discountCodeError={null}
      isUpdatingDiscountCode={false}
      isDiscountCodeControlsEnabled={false}
      onDiscountCodeChange={undefined}
      onApplyDiscountCode={undefined}
      onRemoveDiscountCode={undefined}
    />
  </div>
</div>

<style>
  .rcb-paddle-summary {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapLarge-mobile, 16px);
    width: 100%;
  }

  .rcb-paddle-summary-card {
    background: var(--rcb-card-bg);
    border-radius: var(--rcb-card-radius);
    padding: var(--rc-spacing-gapLarge-mobile, 24px);
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapMedium-mobile, 12px);
  }

  .rcb-paddle-summary-amount {
    color: var(--rc-color-primary);
    font-weight: 700;
    font-size: 2rem;
    line-height: 1.2;
  }
</style>
