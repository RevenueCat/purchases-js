<script lang="ts">
  import { type Writable } from "svelte/store";
  import { type Translator } from "../localization/translator";
  import { getContext } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { type PriceBreakdown } from "../ui-types";
  import { getNextRenewalDate } from "../../helpers/duration-helper";
  import {
    type PricingPhase,
    type DiscountPhase,
  } from "../../entities/offerings";
  import PricingDropdown from "./pricing-dropdown.svelte";
  import Skeleton from "../atoms/skeleton.svelte";
  import Typography from "../atoms/typography.svelte";
  import { getDurationInDays } from "../../helpers/paywall-period-helpers";

  interface Props {
    priceBreakdown: PriceBreakdown;
    trialPhase: PricingPhase | null;
    basePhase: PricingPhase | null;
    promotionalPricePhase: PricingPhase | DiscountPhase | null;
    hasDiscount: boolean;
  }

  const {
    priceBreakdown,
    trialPhase,
    basePhase,
    promotionalPricePhase,
    hasDiscount,
  }: Props = $props();

  const trialEndDate = $derived(
    trialPhase?.period
      ? getNextRenewalDate(new Date(), trialPhase.period, true)
      : null,
  );

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const showTaxBreakdown = $derived(
    priceBreakdown.taxCalculationStatus !== "unavailable" &&
      priceBreakdown.taxCalculationStatus !== "disabled" &&
      priceBreakdown.taxBreakdown &&
      priceBreakdown.taxBreakdown.length > 0,
  );

  const subtotalAmount = $derived(
    basePhase?.price?.amountMicros ?? priceBreakdown.totalAmountInMicros,
  );

  const discountAmount = $derived.by(() => {
    if (!hasDiscount) return 0;

    const base = basePhase?.price?.amountMicros;
    const promo = promotionalPricePhase?.price?.amountMicros;
    if (base == null || promo == null) return 0;

    return base - promo;
  });

  const totalDueToday = $derived(
    trialEndDate ? 0 : priceBreakdown.totalAmountInMicros,
  );

  const discountDurationSuffix = $derived.by(() => {
    if (
      !promotionalPricePhase ||
      !("durationMode" in promotionalPricePhase) ||
      promotionalPricePhase.durationMode !== "time_window"
    ) {
      return "";
    }

    const basePeriod = basePhase?.period;
    const discountPeriod = promotionalPricePhase.period;
    if (
      !basePeriod ||
      !discountPeriod ||
      promotionalPricePhase.cycleCount <= 0
    ) {
      return "";
    }

    const billingCycleDays = getDurationInDays(basePeriod);
    const discountWindowDays = getDurationInDays({
      number: discountPeriod.number * promotionalPricePhase.cycleCount,
      unit: discountPeriod.unit,
    });

    if (billingCycleDays <= 0 || discountWindowDays <= billingCycleDays) {
      return "";
    }

    const translatedPeriod = $translator.translatePeriod(
      discountPeriod.number * promotionalPricePhase.cycleCount,
      discountPeriod.unit,
    );

    return translatedPeriod ? ` (${translatedPeriod})` : "";
  });
</script>

{#snippet pricingTable()}
  <div class="rcb-pricing-table">
    {#if hasDiscount}
      <div class="rcb-pricing-table-row">
        <div class="rcb-pricing-table-header">
          <div class="rcb-pricing-table-value">
            <Typography size="body-small">
              {$translator.translate(LocalizationKeys.PricingTableSubtotal)}
            </Typography>
          </div>
        </div>
        <div class="rcb-pricing-table-value">
          <Typography size="body-small">
            {$translator.formatPrice(subtotalAmount, priceBreakdown.currency)}
          </Typography>
        </div>
      </div>

      <div class="rcb-pricing-table-row">
        <div class="rcb-pricing-table-header">
          <div class="rcb-pricing-table-value">
            <Typography size="body-small">
              {$translator.translate(
                LocalizationKeys.PricingTableDiscount,
              )}{promotionalPricePhase &&
              "name" in promotionalPricePhase &&
              promotionalPricePhase.name
                ? `: ${promotionalPricePhase.name}`
                : ""}{discountDurationSuffix}
            </Typography>
          </div>
        </div>
        <div class="rcb-pricing-table-value">
          <Typography size="body-small">
            -{$translator.formatPrice(discountAmount, priceBreakdown.currency)}
          </Typography>
        </div>
      </div>

      <div class="rcb-pricing-table-separator"></div>
    {/if}

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
          {$translator.formatPrice(totalDueToday, priceBreakdown.currency)}
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
