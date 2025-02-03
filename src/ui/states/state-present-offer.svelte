<script lang="ts">
  import ModalSection from "../modal-section.svelte";
  import Localized from "../localization/localized.svelte";
  import {
    getTranslatedPeriodFrequency,
    getTranslatedPeriodLength,
  } from "../../helpers/price-labels";
  import {
    type NonSubscriptionOption,
    type Product,
    ProductType,
    type PurchaseOption,
    type SubscriptionOption,
  } from "../../entities/offerings";
  import { type BrandingAppearance } from "../../networking/responses/branding-response";
  import { getContext } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";

  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { parseISODuration, PeriodUnit } from "../../helpers/duration-helper";

  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;
  export let brandingAppearance: BrandingAppearance | undefined = undefined;

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
    parseISODuration(productDetails.normalPeriodDuration)?.unit ==
      PeriodUnit.Month;

  const formattedSubscriptionBasePrice =
    subscriptionBasePrice &&
    translator.formatPrice(
      subscriptionBasePrice.amountMicros,
      subscriptionBasePrice.currency,
    );

  const formattedSubscriptionPriceAfterTrial =
    subscriptionTrial && formattedSubscriptionBasePrice;

  const formattedNonSubscriptionBasePrice =
    nonSubscriptionBasePrice &&
    translator.formatPrice(
      nonSubscriptionBasePrice.amountMicros,
      nonSubscriptionBasePrice.currency,
    );

  export let expanded: boolean;
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
      <div>
        <span class="rcb-product-price">
          {#if subscriptionTrial?.periodDuration}
            <Localized
              key={LocalizationKeys.StatePresentOfferFreeTrialDuration}
              variables={{
                trialDuration: getTranslatedPeriodLength(
                  subscriptionTrial.periodDuration,
                  translator,
                ),
              }}
            />
          {/if}
          {#if !subscriptionTrial?.periodDuration && subscriptionBasePrice}
            <Localized
              key={LocalizationKeys.StatePresentOfferProductPrice}
              variables={{
                productPrice: formattedSubscriptionBasePrice,
              }}
            />
          {/if}
        </span>
        <span class="rcb-product-price-frequency"
          >per month {#if !isMonthlyProduct}
            <span class="rcb-product-price-monthly">($2.91 per month)</span>
          {/if}
        </span>
      </div>
      {#if subscriptionTrial && subscriptionBasePrice}
        <span class="rcb-product-price-after-trial">
          <Localized
            key={LocalizationKeys.StatePresentOfferPriceAfterFreeTrial}
            variables={{
              productPrice: formattedSubscriptionPriceAfterTrial,
            }}
          />
        </span>
      {/if}
      <div class="rcb-product-details {expanded ? 'expanded' : 'collapsed'}">
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
            <Localized key={LocalizationKeys.StatePresentOfferCancelAnytime} />
          </li>
        </ul>
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
</ModalSection>

<style>
  .rcb-pricing-info {
    display: flex;
    flex-direction: column;
    font: var(--rc-text-body1-mobile);
    gap: var(--rc-spacing-gapXXLarge-desktop);
  }

  .rcb-product-title {
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-titleLarge-mobile);
  }

  .rcb-product-price {
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-titleXLarge-mobile);
    margin: 12px 0px;
  }

  .rcb-product-price-frequency {
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-caption-mobile);
  }

  .rcb-product-price-monthly {
    color: var(--rc-color-grey-text-light);
    font: var(--rc-text-caption-mobile);
  }

  .rcb-product-description {
    font: var(--rc-text-body2-mobile);
    color: var(--rc-color-grey-text-dark);
    margin: 0 0 12px 0;
  }

  .rcb-product-price-after-trial {
    margin-bottom: 12px;
  }

  .rcb-product-details {
    color: var(--rc-color-grey-text-light);

    margin: 0px;

    overflow: hidden;
    max-height: 0;
    transition:
      max-height 0.1s ease-in-out,
      padding-top 0.1s ease-in-out,
      padding-bottom 0.1s ease-in-out;
  }

  .rcb-product-details ul {
    list-style-type: disc;
    list-style-position: inside;
    padding: 0px;
  }

  .rcb-product-details.expanded {
    max-height: 500px;
  }

  .rcb-product-details.collapsed {
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
  @media screen and (max-width: 767px) {
    .rcb-pricing-info {
      gap: var(--rc-spacing-gapXLarge-mobile);
      margin-top: var(--rc-spacing-gapXLarge-mobile);
    }
  }

  @media screen and (min-width: 768px) {
    .rcb-pricing-info {
      margin-top: calc(var(--rc-spacing-gapXXLarge-desktop) * 2);
      margin-bottom: calc(var(--rc-spacing-gapXXLarge-desktop) * 2);
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
      font: var(--rc-text-body2-desktop);
    }

    .rcb-product-details {
      max-height: 500px;
    }

    .rcb-product-details.collapsed {
      max-height: 500px;
    }
  }
</style>
