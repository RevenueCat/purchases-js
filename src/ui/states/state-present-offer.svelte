<script lang="ts">
  import { slide } from "svelte/transition";
  import ModalSection from "../modal-section.svelte";
  import Localized from "../localization/localized.svelte";
  import {
    getTranslatedPeriodFrequency,
    getTranslatedPeriodLength,
  } from "../../helpers/price-labels";
  import { getPricePerMonth } from "../../helpers/paywall-variables-helpers";
  import {
    type NonSubscriptionOption,
    type Product,
    ProductType,
    type PurchaseOption,
    type SubscriptionOption,
  } from "../../entities/offerings";
  import { getContext } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";

  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { parseISODuration, PeriodUnit } from "../../helpers/duration-helper";
  import Badge from "../badge.svelte";
  import type { BrandingAppearance } from "../../entities/branding";

  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;
  export let brandingAppearance: BrandingAppearance | undefined = undefined;
  export let expanded: boolean;

  const isSubscription =
    productDetails.productType === ProductType.Subscription;
  const subscriptionOption: SubscriptionOption | null | undefined =
    purchaseOption as SubscriptionOption;
  const nonSubscriptionOption: NonSubscriptionOption | null | undefined =
    purchaseOption as NonSubscriptionOption;

  const subscriptionTrial = subscriptionOption?.trial;

  const subscriptionBasePrice = subscriptionOption?.base?.price;
  const nonSubscriptionBasePrice = nonSubscriptionOption?.basePrice;

  const translator: Translator =
    getContext(translatorContextKey) || Translator.fallback();

  const isMonthlyProduct =
    productDetails.normalPeriodDuration &&
    parseISODuration(productDetails.normalPeriodDuration)?.unit ===
      PeriodUnit.Month;

  const periodUnit =
    productDetails.normalPeriodDuration &&
    parseISODuration(productDetails.normalPeriodDuration)?.unit;

  const formattedPeriod =
    (productDetails.normalPeriodDuration &&
      periodUnit &&
      translator.translatePeriodUnit(periodUnit)) ??
    null;

  const formattedSubscriptionBasePrice =
    subscriptionBasePrice &&
    translator.formatPrice(
      subscriptionBasePrice.amountMicros,
      subscriptionBasePrice.currency,
    );

  const formattedNonSubscriptionBasePrice =
    nonSubscriptionBasePrice &&
    translator.formatPrice(
      nonSubscriptionBasePrice.amountMicros,
      nonSubscriptionBasePrice.currency,
    );
</script>

<ModalSection>
  <div class="rcb-pricing-info">
    <span class="rcb-product-title">
      <Localized
        key={LocalizationKeys.StatePresentOfferProductTitle}
        variables={{ productTitle: productDetails.title }}
      />
    </span>

    {#if isSubscription}
      <div class="rcb-product-price-container">
        <div>
          <span class="rcb-product-price">
            {#if subscriptionBasePrice}
              <Localized
                key={LocalizationKeys.StatePresentOfferProductPrice}
                variables={{
                  productPrice: formattedSubscriptionBasePrice,
                }}
              />
            {/if}
          </span>
          {#if productDetails.normalPeriodDuration}
            <span class="rcb-product-price-frequency">
              <span class="rcb-product-price-frequency-text">
                per {formattedPeriod}
              </span>
              {#if !isMonthlyProduct && subscriptionBasePrice}
                <span class="rcb-product-price-monthly">
                  ({getPricePerMonth({
                    price: subscriptionBasePrice,
                    period: parseISODuration(
                      productDetails.normalPeriodDuration,
                    ),
                    translator,
                  })} per month)
                </span>
              {/if}
            </span>
          {/if}
        </div>
        {#if subscriptionTrial?.periodDuration}
          <div class="rcb-product-price-badge">
            <Badge>
              {#snippet text()}
                <Localized
                  key={LocalizationKeys.StatePresentOfferFreeTrialDuration}
                  variables={{
                    trialDuration: getTranslatedPeriodLength(
                      subscriptionTrial.periodDuration!,
                      translator,
                    ),
                  }}
                />
              {/snippet}
            </Badge>
          </div>
        {/if}
      </div>

      {#if expanded}
        <div class="rcb-product-details" transition:slide>
          {#if brandingAppearance?.show_product_description && productDetails.description}
            <span class="rcb-product-description">
              <Localized
                key={LocalizationKeys.StatePresentOfferProductDescription}
                variables={{
                  productDescription: productDetails.description,
                }}
              />
            </span>
          {/if}
          <ul>
            {#if productDetails.normalPeriodDuration}
              <li>
                <Localized
                  key={LocalizationKeys.StatePresentOfferRenewalFrequency}
                  variables={{
                    frequency: getTranslatedPeriodFrequency(
                      productDetails.normalPeriodDuration,
                      translator,
                    ),
                  }}
                />
              </li>
            {/if}
            <li>
              <Localized
                key={LocalizationKeys.StatePresentOfferContinuesUntilCancelled}
              />
            </li>
            <li>
              <Localized
                key={LocalizationKeys.StatePresentOfferCancelAnytime}
              />
            </li>
          </ul>
        </div>
      {/if}
    {/if}

    {#if !isSubscription}
      <span class="rcb-product-price">
        <Localized
          key={LocalizationKeys.StatePresentOfferProductPrice}
          variables={{ productPrice: formattedNonSubscriptionBasePrice }}
        />
      </span>

      {#if brandingAppearance?.show_product_description}
        <span class="rcb-product-description">
          <Localized
            key={LocalizationKeys.StatePresentOfferProductDescription}
            variables={{ productDescription: productDetails.description }}
          />
        </span>
      {/if}
    {/if}
  </div>
</ModalSection>

<style>
  .rcb-pricing-info {
    display: flex;
    flex-direction: column;
    font: var(--rc-text-body1-mobile);
    gap: 0;
  }

  /* Adjust spacing when the details section is present */
  .rcb-pricing-info:has(.rcb-product-details) {
    gap: var(--rc-spacing-gapXXLarge-mobile);
  }

  .rcb-product-title {
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-titleLarge-mobile);
  }

  .rcb-product-price {
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-titleXLarge-mobile);
    margin: 12px 0;
  }

  .rcb-product-price-frequency {
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-caption-mobile);
  }

  .rcb-product-price-frequency-text {
    white-space: nowrap;
  }

  .rcb-product-price-monthly {
    color: var(--rc-color-grey-text-light);
    font: var(--rc-text-caption-mobile);
    white-space: nowrap;
  }

  .rcb-product-description {
    font: var(--rc-text-bodySmall-mobile);
    color: var(--rc-color-grey-text-dark);
  }

  /* Removed old transition styles for .rcb-product-details */
  .rcb-product-details {
    color: var(--rc-color-grey-text-light);
    margin: 0;
    gap: var(--rc-spacing-gapXLarge-mobile);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .rcb-product-details ul {
    list-style-type: disc;
    list-style-position: inside;
    padding: 0;
    margin: 0;
  }

  .rcb-product-price-container {
    display: flex;
    flex-direction: row;
    gap: var(--rc-spacing-gapXLarge-mobile);
  }

  .rcb-product-price-badge {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @container layout-query-container (width < 768px) {
    .rcb-pricing-info:not(:has(.rcb-product-details))
      > *:not(:last-child):not(.rcb-product-price-container) {
      margin-bottom: var(--rc-spacing-gapXLarge-mobile);
    }

    .rcb-pricing-info:has(.rcb-product-details) {
      gap: var(--rc-spacing-gapXLarge-mobile);
    }

    .rcb-pricing-info {
      margin-top: var(--rc-spacing-gapXLarge-mobile);
    }
  }

  @container layout-query-container (width >= 768px) {
    .rcb-pricing-info {
      margin-top: calc(var(--rc-spacing-gapXXLarge-desktop) * 2);
      gap: var(--rc-spacing-gapXLarge-desktop);
    }

    .rcb-pricing-info:has(.rcb-product-details) {
      gap: var(--rc-spacing-gapXXLarge-desktop);
    }

    .rcb-product-price-container {
      gap: var(--rc-spacing-gapXLarge-desktop);
    }

    .rcb-product-title {
      font: var(--rc-text-titleXLarge-desktop);
    }

    .rcb-product-price {
      font: var(--rc-text-titleXLarge-desktop);
    }

    .rcb-product-price-frequency {
      font: var(--rc-text-caption-desktop);
    }

    .rcb-product-price-monthly {
      font: var(--rc-text-caption-desktop);
    }

    .rcb-product-description {
      font: var(--rc-text-bodySmall-desktop);
    }
  }
</style>
