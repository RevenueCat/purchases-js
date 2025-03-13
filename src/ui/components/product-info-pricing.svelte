<script lang="ts">
  import Localized from "../localization/localized.svelte";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import {
    type SubscriptionOption,
    type NonSubscriptionOption,
    type Product,
    type PurchaseOption,
    ProductType,
  } from "../../entities/offerings";
  import { getTranslatedPeriodLength } from "../../helpers/price-labels";
  import type { Translator } from "../localization/translator";
  import { translatorContextKey } from "../localization/constants";
  import { type Writable } from "svelte/store";
  import { getContext } from "svelte";
  import { getNextRenewalDate } from "../../helpers/duration-helper";

  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;
  export let showProductDescription: boolean = false;

  const subscriptionOption: SubscriptionOption | null | undefined =
    purchaseOption as SubscriptionOption;
  const nonSubscriptionOption: NonSubscriptionOption | null | undefined =
    purchaseOption as NonSubscriptionOption;

  const isSubscription =
    productDetails.productType === ProductType.Subscription;
  const subscriptionTrial = subscriptionOption?.trial;

  const subscriptionBasePrice = subscriptionOption?.base?.price;
  const nonSubscriptionBasePrice = nonSubscriptionOption?.basePrice;

  const translator: Writable<Translator> = getContext(translatorContextKey);

  let renewalDate = null;
  const expectedPeriod =
    subscriptionOption?.trial?.period || subscriptionOption?.base?.period;
  if (expectedPeriod) {
    renewalDate = getNextRenewalDate(
      new Date(),
      expectedPeriod,
      isSubscription,
    );
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

  const formattedNonSubscriptionBasePrice =
    nonSubscriptionBasePrice &&
    $translator.formatPrice(
      nonSubscriptionBasePrice.amountMicros,
      nonSubscriptionBasePrice.currency,
    );
</script>

{#if isSubscription}
  <div class="rcb-product-price-container">
    {#if subscriptionTrial?.periodDuration}
      <div class="rcb-product-trial">
        <Localized
          key={LocalizationKeys.StatePresentOfferFreeTrialDuration}
          variables={{
            trialDuration: getTranslatedPeriodLength(
              subscriptionTrial.periodDuration || "",
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
            key={LocalizationKeys.StatePresentOfferProductPrice}
            variables={{
              productPrice: formattedSubscriptionBasePrice,
            }}
          />
        </span>
      {/if}

      {#if subscriptionOption?.base?.period}
        <span class="rcb-product-price-frequency">
          <span class="rcb-product-price-frequency-text">
            {$translator.translatePeriodFrequency(
              subscriptionOption.base.period.number,
              subscriptionOption.base.period.unit,
              { useMultipleWords: true },
            )}</span
          >
        </span>
      {/if}
    </div>
  </div>

  <div class="rcb-product-details expanded">
    <div class="rcb-product-details-padding">
      {#if subscriptionTrial?.periodDuration}
        <div class="rcb-product-trial-explanation">
          <div class="rcb-after-trial-ends rcb-text-dark">
            <Localized
              key={LocalizationKeys.StatePresentOfferPriceAfterFreeTrial}
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
            <Localized
              key={LocalizationKeys.StatePresentOfferPriceTotalDueToday}
            />
          </div>
          <div class="rcb-text-dark rcb-total-due-today">
            {formattedZeroPrice}
          </div>
        </div>
      {/if}
    </div>
  </div>
{:else}
  <span class="rcb-product-price">
    <Localized
      key={LocalizationKeys.StatePresentOfferProductPrice}
      variables={{ productPrice: formattedNonSubscriptionBasePrice }}
    />
  </span>

  {#if showProductDescription}
    <span class="rcb-product-description">
      <Localized
        key={LocalizationKeys.StatePresentOfferProductDescription}
        variables={{ productDescription: productDetails.description }}
      />
    </span>
  {/if}
{/if}

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

  .rcb-product-description {
    font: var(--rc-text-body1-mobile);
    color: var(--rc-color-grey-text-dark);
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

    .rcb-product-description {
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
