<script lang="ts">
  import { type Writable } from "svelte/store";
  import { type Translator } from "../localization/translator";
  import { getContext } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import TaxTitle from "../atoms/tax-title.svelte";

  type TaxItem = {
    taxType: string | null;
    taxPercentageInMicros: number | null;
    taxAmountInMicros: number;
    country: string | null;
    state: string | null;
  };

  export let currency: string;
  export let totalExcludingTax: number;
  export let taxItems: TaxItem[] | null | undefined = undefined;
  export let trialEndDate: Date | null | undefined = undefined;
  export let renewalTotal: number | null | undefined = undefined;
  export let total: number;
  export let loadingTaxes: boolean = false;
  export let calculationError:
    | "needs_postal_code"
    | "needs_state_or_postal_code"
    | null
    | undefined = undefined;

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const totalExcludingTaxMicros = totalExcludingTax * 1000000;
  const totalMicros = total * 1000000;
  const renewalTotalMicros = renewalTotal ? renewalTotal * 1000000 : null;
  const formattedtotalExcludingTax = $translator.formatPrice(
    totalExcludingTaxMicros,
    currency,
  );
  const formattedRenewalTotal = renewalTotalMicros
    ? $translator.formatPrice(renewalTotalMicros, currency)
    : null;
  const formattedTotal = $translator.formatPrice(totalMicros, currency);
</script>

<div class="pricing-table">
  <div class="rcb-pricing-table-row">
    <div class="rcb-pricing-table-header">
      {$translator.translate(LocalizationKeys.PricingTotalExcludingTax)}
    </div>
    <div class="rcb-pricing-table-value">{formattedtotalExcludingTax}</div>
  </div>

  {#if taxItems !== undefined}
    {#if taxItems == null}
      <div class="rcb-pricing-table-row">
        <div class="rcb-pricing-table-header">
          {$translator.translate(LocalizationKeys.PricingTableTax)}
        </div>
        <div class="rcb-pricing-table-value">
          {#if loadingTaxes}
            <div class="rcb-pricing-table-value-loading">Loading</div>
          {:else if calculationError === "needs_postal_code"}
            {$translator.translate(
              LocalizationKeys.PricingTableEnterPostalCodeToCalculate,
            )}
          {:else if calculationError === "needs_state_or_postal_code"}
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
    {/if}
    {#if taxItems !== null}
      {#each taxItems as taxItem}
        <div class="rcb-pricing-table-row">
          <div class="rcb-pricing-table-header">
            <TaxTitle
              taxType={taxItem.taxType}
              country={taxItem.country}
              state={taxItem.state}
              taxPercentageInMicros={taxItem.taxPercentageInMicros}
            />
          </div>
          <div class="rcb-pricing-table-value">
            {$translator.formatPrice(taxItem.taxAmountInMicros, currency)}
          </div>
        </div>
      {/each}
    {/if}
  {/if}

  <div class="rcb-pricing-table-separator"></div>

  {#if trialEndDate && renewalTotal}
    <div class="rcb-pricing-table-row">
      <div class="rcb-pricing-table-header">
        {$translator.translate(LocalizationKeys.PricingTableTrialEnds, {
          formattedTrialEndDate: $translator.translateDate(trialEndDate),
        })}
      </div>
      <div class="rcb-pricing-table-value">
        {formattedRenewalTotal}
      </div>
    </div>
  {/if}

  <div class="rcb-pricing-table-row header">
    <div class="rcb-pricing-table-header total">
      {$translator.translate(LocalizationKeys.PricingTableTotalDueToday)}
    </div>
    <div class="rcb-pricing-table-value">{formattedTotal}</div>
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
