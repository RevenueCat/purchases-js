<script lang="ts">
  import { type Writable } from "svelte/store";
  import { type Translator } from "../localization/translator";
  import { getContext } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { type PriceBreakdown } from "../ui-types";
  import { getNextRenewalDate } from "../../helpers/duration-helper";
  import { type PricingPhase } from "../../entities/offerings";
  import PricingDropdown from "./pricing-dropdown.svelte";

  interface Props {
    priceBreakdown: PriceBreakdown;
    trialPhase: PricingPhase | null;
  }

  let { priceBreakdown, trialPhase }: Props = $props();

  let trialEndDate = $state<Date | null>(null);
  if (trialPhase?.period) {
    trialEndDate = getNextRenewalDate(new Date(), trialPhase.period, true);
  }

  const translator: Writable<Translator> = getContext(translatorContextKey);
</script>

{#snippet pricingTable()}
  <div class="rcb-pricing-table">
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

      {#if priceBreakdown.taxCalculationStatus === "loading"}
        <div class="rcb-pricing-table-row">
          <div class="rcb-pricing-table-header">
            {$translator.translate(LocalizationKeys.PricingTableTax)}
          </div>
          <div class="rcb-pricing-table-value">
            <div class="rcb-pricing-table-value-loading">Loading</div>
          </div>
        </div>
      {:else if priceBreakdown.taxCalculationStatus === "pending"}
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
              {taxItem.display_name}
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
            formattedTrialEndDate: $translator.translateDate(trialEndDate, {
              dateStyle: "medium",
            }),
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

    <div class="rcb-pricing-table-row rcb-header rcb-total">
      <div class="rcb-pricing-table-header">
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
{/snippet}

{#if priceBreakdown.taxCollectionEnabled}
  <PricingDropdown>
    {@render pricingTable()}
  </PricingDropdown>
{:else}
  {@render pricingTable()}
{/if}

<style>
  .rcb-pricing-table {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapSmall-mobile);
    font: var(--rc-text-caption-mobile);
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

  .rcb-pricing-table-row > .rcb-pricing-table-header {
    opacity: 0.7;
  }

  .rcb-pricing-table-row > .rcb-pricing-table-value {
    opacity: 1;
  }
  .rcb-pricing-table-row.rcb-total > .rcb-pricing-table-header,
  .rcb-pricing-table-row.rcb-total > .rcb-pricing-table-value {
    opacity: 1;
  }

  .rcb-pricing-table-value-loading {
    color: transparent;
    animation: rcb-pricing-table-value-loading 1.5s ease-in-out 0s infinite
      normal none running;
    cursor: progress;
    background-color: var(--rc-color-grey-text-dark);
    user-select: none;
    padding: 0 4px;
    border-radius: var(--rc-shape-input-button-border-radius);
  }

  @keyframes rcb-pricing-table-value-loading {
    0%,
    100% {
      opacity: 0.5;
    }
    50% {
      opacity: 0.3;
    }
  }

  @container layout-query-container (width >= 768px) {
    .rcb-pricing-table-separator {
      display: none;
    }
    .rcb-pricing-table {
      gap: var(--rc-spacing-gapSmall-desktop);
    }
    .rcb-pricing-table-row > .rcb-pricing-table-header,
    .rcb-pricing-table-row > .rcb-pricing-table-value {
      font: var(--rc-text-caption-desktop);
      opacity: 0.7;
    }
    .rcb-pricing-table-row.rcb-total {
      padding-top: var(--rc-spacing-gapSmall-desktop);
      font: var(--rc-text-body1-desktop);
    }
  }
</style>
