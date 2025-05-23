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
  import Skeleton from "../atoms/skeleton.svelte";
  import Typography from "../atoms/typography.svelte";

  interface Props {
    priceBreakdown: PriceBreakdown;
    trialPhase: PricingPhase | null;
  }

  const { priceBreakdown, trialPhase }: Props = $props();

  let trialEndDate = $state<Date | null>(null);
  if (trialPhase?.period) {
    trialEndDate = getNextRenewalDate(new Date(), trialPhase.period, true);
  }

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const showTaxBreakdown = $derived(
    priceBreakdown.taxCalculationStatus !== "unavailable" &&
      priceBreakdown.taxCalculationStatus !== "disabled" &&
      priceBreakdown.taxBreakdown &&
      priceBreakdown.taxBreakdown.length > 0,
  );
</script>

{#snippet pricingTable()}
  <div class="rcb-pricing-table">
    {#if showTaxBreakdown}
      <div class="rcb-pricing-table-row">
        <div class="rcb-pricing-table-header">
          <Typography size="body-small">
            {$translator.translate(LocalizationKeys.PricingTotalExcludingTax)}
          </Typography>
        </div>
        <div class="rcb-pricing-table-value">
          <Typography size="body-small">
            {$translator.formatPrice(
              priceBreakdown.totalExcludingTaxInMicros,
              priceBreakdown.currency,
            )}
          </Typography>
        </div>
      </div>

      {#if priceBreakdown.taxCalculationStatus === "loading"}
        <div class="rcb-pricing-table-row" data-testid="tax-loading-skeleton">
          <div class="rcb-pricing-table-header">
            <Typography size="body-small">
              {$translator.translate(LocalizationKeys.PricingTableTax)}
            </Typography>
          </div>
          <div class="rcb-pricing-table-value">
            <Typography size="body-small">
              <Skeleton>
                {$translator.formatPrice(12340000, priceBreakdown.currency)}
              </Skeleton>
            </Typography>
          </div>
        </div>
      {:else if priceBreakdown.taxCalculationStatus === "pending"}
        <div class="rcb-pricing-table-row">
          <div class="rcb-pricing-table-header">
            {$translator.translate(LocalizationKeys.PricingTableTax)}
          </div>
          <div class="rcb-pricing-table-value">
            <Typography size="body-small">
              {$translator.translate(
                LocalizationKeys.PricingTableEnterBillingAddressToCalculate,
              )}
            </Typography>
          </div>
        </div>
      {:else if priceBreakdown.taxBreakdown !== null}
        {#each priceBreakdown.taxBreakdown as taxItem}
          <div class="rcb-pricing-table-row">
            <div class="rcb-pricing-table-header">
              <Typography size="body-small">
                {taxItem.display_name}
              </Typography>
            </div>
            <div class="rcb-pricing-table-value">
              <Typography size="body-small">
                {$translator.formatPrice(
                  taxItem.tax_amount_in_micros,
                  priceBreakdown.currency,
                )}
              </Typography>
            </div>
          </div>
        {/each}
      {/if}

      <div class="rcb-pricing-table-separator"></div>
    {/if}

    {#if trialEndDate}
      <div class="rcb-pricing-table-row">
        <div class="rcb-pricing-table-header">
          <Typography size="body-small">
            {$translator.translate(LocalizationKeys.PricingTableTrialEnds, {
              formattedTrialEndDate: $translator.translateDate(trialEndDate, {
                dateStyle: "medium",
              }),
            })}
          </Typography>
        </div>
        <div class="rcb-pricing-table-value">
          <Typography size="body-small">
            {$translator.formatPrice(
              priceBreakdown.totalAmountInMicros,
              priceBreakdown.currency,
            )}
          </Typography>
        </div>
      </div>
    {/if}

    <div class="rcb-pricing-table-row rcb-header">
      <div class="rcb-pricing-table-header">
        <Typography size="body-small">
          {$translator.translate(LocalizationKeys.PricingTableTotalDueToday)}
        </Typography>
      </div>
      <div class="rcb-pricing-table-value">
        <Typography size="body-small">
          {#if trialEndDate}
            {$translator.formatPrice(0, priceBreakdown.currency)}
          {:else}
            {$translator.formatPrice(
              priceBreakdown.totalAmountInMicros,
              priceBreakdown.currency,
            )}
          {/if}
        </Typography>
      </div>
    </div>
  </div>
{/snippet}

{#if showTaxBreakdown}
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
    color: var(--rc-color-grey-text-light);
  }

  .rcb-pricing-table-row > .rcb-pricing-table-value {
    color: var(--rc-color-grey-text-dark);
  }

  .rcb-pricing-table-row:last-child > .rcb-pricing-table-header,
  .rcb-pricing-table-row:last-child > .rcb-pricing-table-value {
    color: var(--rc-color-grey-text-dark);
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
      color: var(--rc-color-grey-text-light);
    }
  }
</style>
