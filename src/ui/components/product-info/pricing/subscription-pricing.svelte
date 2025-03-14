<script lang="ts">
  import Localized from "../../../localization/localized.svelte";
  import { LocalizationKeys } from "../../../localization/supportedLanguages";
  import type { Translator } from "../../../localization/translator";
  import { type SubscriptionOption } from "../../../../entities/offerings";
  import { getTranslatedPeriodLength } from "../../../../helpers/price-labels";
  import { translatorContextKey } from "../../../localization/constants";
  import { type Writable } from "svelte/store";
  import { getContext } from "svelte";
  import { getNextRenewalDate } from "../../../../helpers/duration-helper";

  export let purchaseOption: SubscriptionOption;

  const subscriptionBasePrice = purchaseOption?.base?.price;
  const translator: Writable<Translator> = getContext(translatorContextKey);

  let renewalDate = null;
  const expectedPeriod =
    purchaseOption?.trial?.period || purchaseOption?.base?.period;
  if (expectedPeriod) {
    renewalDate = getNextRenewalDate(new Date(), expectedPeriod, true);
  }

  const formattedSubscriptionBasePrice =
    subscriptionBasePrice &&
    $translator.formatPrice(
      subscriptionBasePrice.amountMicros,
      subscriptionBasePrice.currency,
    );

  const formattedZeroPrice =
    subscriptionBasePrice &&
    $translator.formatPrice(0, subscriptionBasePrice.currency);
</script>

<div class="rcb-product-price-container">
  {#if purchaseOption?.trial?.periodDuration}
    <div class="rcb-product-trial">
      <Localized
        key={LocalizationKeys.ProductInfoFreeTrialDuration}
        variables={{
          trialDuration: getTranslatedPeriodLength(
            purchaseOption.trial.periodDuration || "",
            $translator,
          ),
        }}
      />
    </div>
  {/if}
  <div>
    {#if subscriptionBasePrice}
      <span class="rcb-product-price">
        <Localized
          key={LocalizationKeys.ProductInfoProductPrice}
          variables={{
            productPrice: formattedSubscriptionBasePrice,
          }}
        />
      </span>
    {/if}

    {#if purchaseOption?.base?.period}
      <span class="rcb-product-price-frequency">
        <span class="rcb-product-price-frequency-text">
          {$translator.translatePeriodFrequency(
            purchaseOption.base.period.number,
            purchaseOption.base.period.unit,
            { useMultipleWords: true },
          )}</span
        >
      </span>
    {/if}
  </div>
</div>

<div class="rcb-product-details expanded">
  <div class="rcb-product-details-padding">
    {#if purchaseOption?.trial?.periodDuration}
      <div class="rcb-product-trial-explanation">
        <div class="rcb-after-trial-ends rcb-text-dark">
          <Localized
            key={LocalizationKeys.ProductInfoPriceAfterFreeTrial}
            variables={{
              renewalDate:
                renewalDate &&
                $translator.translateDate(renewalDate, {
                  dateStyle: "medium",
                }),
            }}
          />
        </div>
        <div class="rcb-after-trial-ends rcb-text-dark">
          {formattedSubscriptionBasePrice}
        </div>
      </div>
      <div class="rcb-product-trial-explanation">
        <div class="rcb-text-dark rcb-total-due-today">
          <Localized key={LocalizationKeys.ProductInfoPriceTotalDueToday} />
        </div>
        <div class="rcb-text-dark rcb-total-due-today">
          {formattedZeroPrice}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .rcb-product-price {
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-titleMedium-mobile);
  }

  .rcb-product-trial {
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-titleLarge-mobile);
  }

  .rcb-product-price-frequency {
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-body1-mobile);
  }

  .rcb-product-price-frequency-text {
    white-space: nowrap;
  }

  .rcb-product-details {
    color: var(--rc-color-grey-text-light);
    margin: 0;
    overflow: hidden;
    transition: max-height 0.2s ease-in-out;
  }

  .rcb-product-details-padding {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapSmall-mobile);
  }

  .rcb-product-trial-explanation {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .rcb-text-dark {
    color: var(--rc-color-grey-text-dark);
    font-weight: 500;
  }

  @container layout-query-container (width >= 768px) {
    .rcb-product-price {
      font: var(--rc-text-titleMedium-desktop);
    }

    .rcb-product-price-frequency {
      font: var(--rc-text-body1-desktop);
    }

    .rcb-product-details {
      max-height: 500px;
      gap: var(--rc-spacing-gapXLarge-desktop);
    }

    .rcb-product-details-padding {
      gap: var(--rc-spacing-gapMedium-desktop);
    }

    .rcb-total-due-today {
      font: var(--rc-text-titleMedium-desktop);
    }

    .rcb-after-trial-ends {
      font: var(--rc-text-body1-desktop);
    }

    .rcb-product-trial {
      font: var(--rc-text-titleLarge-desktop);
    }
  }
</style>
