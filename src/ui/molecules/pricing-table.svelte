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
  import {
    getTranslatedPeriodFrequency,
    getTranslatedPeriodLength,
    getTranslatedPeriodLengthFromPeriod,
  } from "../../helpers/price-labels";

  // TODO
  // Confirm row ordering (including split line, its wrong in some cases - lots of stories changed)
  // Confirm haven't broken existing
  // Walk through each condition and look for improvements
  // Localize all new strings
  // Dedupe?
  // pricing summary stories
  // product info stories

  interface Props {
    priceBreakdown: PriceBreakdown;
    basePhase: PricingPhase | null;
    trialPhase: PricingPhase | null;
    introPricePhase: PricingPhase | null;
  }

  const { basePhase, priceBreakdown, trialPhase, introPricePhase }: Props =
    $props();

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

  const hasIntroPrice = $derived(introPricePhase?.periodDuration);

  const formattedPrice = $derived(
    $translator.formatPrice(
      hasIntroPrice
        ? (basePhase?.price?.amountMicros ?? 0)
        : priceBreakdown.totalAmountInMicros,
      priceBreakdown.currency,
    ),
  );

  let introPriceEndDate = $state<Date | null>(null);
  if (introPricePhase?.period) {
    introPriceEndDate = getNextRenewalDate(
      new Date(),
      {
        ...introPricePhase.period,
        number: introPricePhase.cycleCount * introPricePhase.period.number,
      },
      true,
    );
  }

  const formattedIntroPrice = $derived(
    $translator.formatPrice(
      priceBreakdown.totalAmountInMicros,
      priceBreakdown.currency,
    ),
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
            {#if introPricePhase?.periodDuration && introPricePhase.cycleCount === 1}
              <Typography size="body-small">
                {$translator.translate(
                  LocalizationKeys.ProductInfoIntroPricePhasePaidUpfrontPaidOnce,
                )}
              </Typography>
            {/if}
            {#if introPricePhase?.period && introPricePhase?.periodDuration && introPricePhase.cycleCount > 1}
              <Typography size="body-small">
                {$translator.translate(
                  LocalizationKeys.PricingTablePaymentCycleLengthAndDuration,
                  {
                    introPriceDuration: getTranslatedPeriodLengthFromPeriod(
                      {
                        ...introPricePhase.period,
                        number:
                          introPricePhase.cycleCount *
                          introPricePhase.period.number,
                      },
                      $translator,
                    ),
                    introPriceFrequency: getTranslatedPeriodFrequency(
                      introPricePhase.periodDuration,
                      $translator,
                    ),
                  },
                )}
              </Typography>
            {/if}
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
    {:else if introPricePhase?.periodDuration}
      <div class="rcb-pricing-table-row">
        <div class="rcb-pricing-table-header">
          {#if introPricePhase.cycleCount === 1}
            <Typography size="body-small">
              {$translator.translate(
                LocalizationKeys.PricingTableIntroPricePaidOnce,
                {
                  introPriceDuration: getTranslatedPeriodLength(
                    introPricePhase.periodDuration,
                    $translator,
                  ),
                },
              )}
            </Typography>
          {/if}

          {#if introPricePhase.period && introPricePhase.cycleCount > 1}
            <Typography size="body-small">
              {$translator.translate(
                LocalizationKeys.PricingTableIntroPricePaidRecurring,
                {
                  introPriceDuration: getTranslatedPeriodLengthFromPeriod(
                    {
                      ...introPricePhase.period,
                      number:
                        introPricePhase.cycleCount *
                        introPricePhase.period.number,
                    },
                    $translator,
                  ),
                  introPriceFrequency: getTranslatedPeriodFrequency(
                    introPricePhase.periodDuration,
                    $translator,
                  ),
                },
              )}
            </Typography>
          {/if}
        </div>
        <div class="rcb-pricing-table-value">
          <Typography size="body-small">
            {formattedIntroPrice}
          </Typography>
        </div>
      </div>
    {/if}
    {#if introPriceEndDate}
      <div class="rcb-pricing-table-row">
        <div class="rcb-pricing-table-header">
          <Typography size="body-small">
            {$translator.translate(
              LocalizationKeys.PricingTableFromDatePaidFrequency,
              {
                startDate: $translator.translateDate(introPriceEndDate, {
                  dateStyle: "medium",
                }),
                basePriceFrequency: getTranslatedPeriodFrequency(
                  basePhase?.periodDuration ?? "",
                  $translator,
                ),
              },
            )}
          </Typography>
        </div>
        <div class="rcb-pricing-table-value">
          <Typography size="body-small">
            {formattedPrice}
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
