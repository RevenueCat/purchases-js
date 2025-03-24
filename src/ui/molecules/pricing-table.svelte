<script lang="ts">
  import { type Writable } from "svelte/store";
  import { type Translator } from "../localization/translator";
  import { getContext } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import TaxTitle from "../atoms/tax-title.svelte";
  import { type PriceBreakdown } from "../ui-types";

  interface Props {
    priceBreakdown: PriceBreakdown;
    trialEndDate: Date | null | undefined;
  }

  let { priceBreakdown, trialEndDate }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);
</script>

<div class="pricing-table">
  {#if priceBreakdown.taxCollectionEnabled}
    <div class="rcb-pricing-table-row">
      <div class="rcb-pricing-table-header">
        {$translator.translate(LocalizationKeys.PricingTotalExcludingTax)}
      </div>
      <div class="rcb-pricing-table-value">
        {$translator.formatPrice(
          priceBreakdown.totalExcludingTaxInMicros,
          priceBreakdown.currency,
        )}
      </div>
    </div>

    {#if priceBreakdown.status === "loading"}
      <div class="rcb-pricing-table-row">
        <div class="rcb-pricing-table-header">
          {$translator.translate(LocalizationKeys.PricingTableTax)}
        </div>
        <div class="rcb-pricing-table-value">
          <div class="rcb-pricing-table-value-loading">Loading</div>
        </div>
      </div>
    {:else if priceBreakdown.status === "pending"}
      <div class="rcb-pricing-table-row">
        <div class="rcb-pricing-table-header">
          {$translator.translate(LocalizationKeys.PricingTableTax)}
        </div>
        <div class="rcb-pricing-table-value">
          {#if priceBreakdown.pendingReason === "needs_postal_code"}
            {$translator.translate(
              LocalizationKeys.PricingTableEnterPostalCodeToCalculate,
            )}
          {:else if priceBreakdown.pendingReason === "needs_state_or_postal_code"}
            {$translator.translate(
              LocalizationKeys.PricingTableEnterStateOrPostalCodeToCalculate,
            )}
          {:else}
            {$translator.translate(
              LocalizationKeys.PricingTableEnterBillingAddressToCalculate,
            )}
          {/if}
        </div>
      </div>
    {:else if priceBreakdown.taxBreakdown !== null}
      {#each priceBreakdown.taxBreakdown as taxItem}
        <div class="rcb-pricing-table-row">
          <div class="rcb-pricing-table-header">
            {#if taxItem.display_name}
              {taxItem.display_name}
            {:else}
              <TaxTitle
                taxType={taxItem.tax_type}
                country={taxItem.country}
                state={taxItem.state}
                taxPercentageInMicros={taxItem.tax_rate_in_micros}
              />
            {/if}
          </div>
          <div class="rcb-pricing-table-value">
            {$translator.formatPrice(
              taxItem.tax_amount_in_micros,
              priceBreakdown.currency,
            )}
          </div>
        </div>
      {/each}
    {/if}

    <div class="rcb-pricing-table-separator"></div>
  {/if}

  {#if trialEndDate}
    <div class="rcb-pricing-table-row">
      <div class="rcb-pricing-table-header">
        {$translator.translate(LocalizationKeys.PricingTableTrialEnds, {
          formattedTrialEndDate: $translator.translateDate(trialEndDate),
        })}
      </div>
      <div class="rcb-pricing-table-value">
        {$translator.formatPrice(
          priceBreakdown.totalAmountInMicros,
          priceBreakdown.currency,
        )}
      </div>
    </div>
  {/if}

  <div class="rcb-pricing-table-row header">
    <div class="rcb-pricing-table-header total">
      {$translator.translate(LocalizationKeys.PricingTableTotalDueToday)}
    </div>
    <div class="rcb-pricing-table-value">
      {#if trialEndDate}
        {$translator.formatPrice(0, priceBreakdown.currency)}
      {:else}
        {$translator.formatPrice(
          priceBreakdown.totalAmountInMicros,
          priceBreakdown.currency,
        )}
      {/if}
    </div>
  </div>
</div>

<style>
  .pricing-table {
    font-size: 12px;
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapSmall-mobile);
  }

  .rcb-pricing-table-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .rcb-pricing-table-separator {
    height: 1px;
    background-color: var(--rc-color-grey-ui-dark);
  }

  .rcb-pricing-table-row > .rcb-pricing-table-header:not(.total) {
    opacity: 0.7;
  }

  .rcb-pricing-table-value-loading {
    color: transparent;
    animation: rcb-pricing-table-value-loading 1.5s ease-in-out 0s infinite
      normal none running;
    cursor: progress;
    background-color: var(--rc-color-grey-ui-dark);
    user-select: none;
  }

  @keyframes rcb-pricing-table-value-loading {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }
</style>
