<script lang="ts">
  import {
    type Product,
    type PurchaseOption,
    type SubscriptionOption,
    type NonSubscriptionOption,
    type PricingPhase,
    type DiscountPhase,
  } from "../../entities/offerings";
  import PricingTable from "../molecules/pricing-table.svelte";
  import ProductHeader from "../molecules/product-header.svelte";
  import PricingSummary from "../molecules/pricing-summary.svelte";
  import PricingSummaryNonSubscription from "../molecules/pricing-summary-non-subscription.svelte";
  import { type PriceBreakdown } from "../ui-types";

  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;
  export let showProductDescription: boolean;
  export let priceBreakdown: PriceBreakdown;
  export let showDiscountCodeField = false;
  export let discountCode = "";
  export let appliedDiscountCode: string | null = null;
  export let discountCodeError: string | null = null;
  export let isUpdatingDiscountCode = false;
  export let isDiscountCodeControlsEnabled = false;
  export let onDiscountCodeChange:
    | ((discountCode: string) => void)
    | undefined = undefined;
  export let onApplyDiscountCode: (() => void | Promise<void>) | undefined =
    undefined;
  export let onRemoveDiscountCode: (() => void | Promise<void>) | undefined =
    undefined;

  let isSubscription: boolean;
  let subscriptionOption: SubscriptionOption | null;
  let nonSubscriptionOption: NonSubscriptionOption | null;
  let basePhase: PricingPhase | null;
  let trialPhase: PricingPhase | null;
  let discountPhase: DiscountPhase | null;
  let introPricePhase: PricingPhase | null;
  let promotionalPricePhase: PricingPhase | DiscountPhase | null;

  $: isSubscription = productDetails.productType === "subscription";
  $: subscriptionOption = isSubscription
    ? (purchaseOption as SubscriptionOption)
    : null;
  $: nonSubscriptionOption = !isSubscription
    ? (purchaseOption as NonSubscriptionOption)
    : null;
  $: basePhase = isSubscription
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
  $: discountPhase =
    subscriptionOption?.discount ?? nonSubscriptionOption?.discount ?? null;
  $: trialPhase = subscriptionOption?.trial ?? null;
  $: introPricePhase = subscriptionOption?.introPrice ?? null;
  $: promotionalPricePhase =
    discountPhase ?? subscriptionOption?.introPrice ?? null;
</script>

<div class="rcb-pricing-info">
  <div class="rcb-pricing-info-header">
    <ProductHeader {productDetails} {showProductDescription} />
    {#if appliedDiscountCode}
      <div>
        <span>{appliedDiscountCode}</span>
        {#if isDiscountCodeControlsEnabled}
          <button
            type="button"
            disabled={isUpdatingDiscountCode}
            onclick={() => onRemoveDiscountCode?.()}
          >
            {isUpdatingDiscountCode ? "Removing..." : "Remove"}
          </button>
        {/if}
      </div>
    {:else if showDiscountCodeField}
      <div>
        <label for="rc-discount-code"> Discount code </label>
        <div>
          <input
            id="rc-discount-code"
            type="text"
            bind:value={discountCode}
            autocomplete="off"
            disabled={isUpdatingDiscountCode || !isDiscountCodeControlsEnabled}
            oninput={() => onDiscountCodeChange?.(discountCode)}
          />
          <button
            type="button"
            disabled={isUpdatingDiscountCode ||
              !isDiscountCodeControlsEnabled ||
              !discountCode.trim()}
            onclick={() => onApplyDiscountCode?.()}
          >
            {isUpdatingDiscountCode ? "Applying..." : "Apply"}
          </button>
        </div>
        {#if discountCodeError}
          <div>{discountCodeError}</div>
        {/if}
      </div>
    {/if}
    {#if isSubscription}
      <PricingSummary
        {priceBreakdown}
        {basePhase}
        {trialPhase}
        {discountPhase}
        {introPricePhase}
      />
    {:else}
      <PricingSummaryNonSubscription {priceBreakdown} {basePhase} />
    {/if}
  </div>
  <PricingTable
    {priceBreakdown}
    {trialPhase}
    {basePhase}
    {promotionalPricePhase}
    hasDiscount={!!discountPhase}
  />
</div>

<style>
  .rcb-pricing-info {
    display: flex;
    flex-direction: column;
    user-select: none;
    gap: var(--rc-spacing-gapXXLarge-mobile);
  }

  .rcb-pricing-info-header {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapLarge-mobile);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-pricing-info {
      gap: var(--rc-spacing-gapXXXLarge-desktop);
    }

    .rcb-pricing-info-header {
      gap: var(--rc-spacing-gapLarge-desktop);
    }
  }
</style>
