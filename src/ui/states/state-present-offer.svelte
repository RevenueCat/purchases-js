<script lang="ts">
  import Localized from "../localization/localized.svelte";
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
  import type { BrandingAppearance } from "../../entities/branding";
  import { getTranslatedPeriodLength } from "../../helpers/price-labels";
  import { getNextRenewalDate } from "../../helpers/duration-helper";

  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;
  export let brandingAppearance: BrandingAppearance | null | undefined =
    undefined;

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

  const formattedSubscriptionBasePrice =
    subscriptionBasePrice &&
    translator.formatPrice(
      subscriptionBasePrice.amountMicros,
      subscriptionBasePrice.currency,
    );

  const formattedZeroPrice =
    subscriptionBasePrice &&
    translator.formatPrice(0, subscriptionBasePrice.currency);

  const formattedNonSubscriptionBasePrice =
    nonSubscriptionBasePrice &&
    translator.formatPrice(
      nonSubscriptionBasePrice.amountMicros,
      nonSubscriptionBasePrice.currency,
    );

  let renewalDate = null;
  const expectedPeriod =
    subscriptionOption.trial?.period || subscriptionOption.base?.period;
  if (expectedPeriod) {
    renewalDate = getNextRenewalDate(
      new Date(),
      expectedPeriod,
      isSubscription,
    );
  }

  export let expanded: boolean;
</script>

<section>
  <div class="rcb-pricing-info">
    <div>
      {#if isSubscription}
        <div class="rcb-subscribe-to">
          <Localized
            key={LocalizationKeys.StatePresentOfferSubscribeTo}
            variables={{ productTitle: productDetails.title }}
          />
        </div>
      {/if}
      <div class="rcb-product-title">
        <Localized
          key={LocalizationKeys.StatePresentOfferProductTitle}
          variables={{ productTitle: productDetails.title }}
        />
      </div>
    </div>

    {#if isSubscription}
      <div class="rcb-product-price-container">
        {#if subscriptionTrial?.periodDuration}
          <div class="rcb-product-trial">
            <Localized
              key={LocalizationKeys.StatePresentOfferFreeTrialDuration}
              variables={{
                trialDuration: getTranslatedPeriodLength(
                  subscriptionTrial.periodDuration || "",
                  translator,
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
                {translator.translatePeriodFrequency(
                  subscriptionOption.base.period.number,
                  subscriptionOption.base.period.unit,
                )}</span
              >
            </span>
          {/if}
        </div>
      </div>

      <div class="rcb-product-details {expanded ? 'expanded' : 'collapsed'}">
        <div class="rcb-product-details-padding">
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
          {#if subscriptionTrial?.periodDuration}
            <div>
              <div class="rcb-product-trial-explanation">
                <div class="rcb-after-trial-ends rcb-text-dark">
                  <Localized
                    key={LocalizationKeys.StatePresentOfferPriceAfterFreeTrial}
                    variables={{
                      renewalDate:
                        renewalDate &&
                        translator.translateDate(renewalDate, {
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
            </div>
          {/if}
        </div>
      </div>
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
</section>

<style>
  .rcb-pricing-info {
    display: flex;
    flex-direction: column;
    font: var(--rc-text-body1-mobile);
    gap: var(--rc-spacing-gapLarge-mobile);
    user-select: none;
  }

  .rcb-product-title {
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-titleXLarge-mobile);
  }

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
    margin: 0px;
    overflow: hidden;
    max-height: 0;
    transition: max-height 0.2s ease-in-out;
  }

  .rcb-product-details-padding {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapXLarge-mobile);
  }

  .rcb-product-details.expanded {
    max-height: 500px;
  }

  .rcb-product-details.collapsed {
    max-height: 0;
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

  .rcb-subscribe-to {
    font: var(--rc-text-body1-desktop);
  }

  @container layout-query-container (width < 768px) {
    .rcb-pricing-info {
      margin-top: var(--rc-spacing-gapXLarge-mobile);
    }

    .rcb-subscribe-to {
      display: none;
    }
  }

  @container layout-query-container (width >= 768px) {
    .rcb-pricing-info {
      margin-top: calc(var(--rc-spacing-gapXXLarge-desktop) * 2);
      /* margin-bottom: calc(var(--rc-spacing-gapXXLarge-desktop) * 2); */
      gap: var(--rc-spacing-gapXXXLarge-desktop);
    }

    .rcb-pricing-info:has(.rcb-product-details.expanded) {
      gap: var(--rc-spacing-gapXXXLarge-desktop);
    }

    .rcb-product-title {
      font: var(--rc-text-titleXLarge-desktop);
    }

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

    .rcb-product-details.collapsed {
      max-height: 500px;
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
