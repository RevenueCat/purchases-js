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

  const subscriptionMonthlyPrice =
    subscriptionBasePrice &&
    translator.formatPrice(
      subscriptionBasePrice.amountMicros,
      subscriptionBasePrice.currency,
    );

  console.log(subscriptionMonthlyPrice);

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
      <ul class="rcb-product-details {expanded ? 'expanded' : 'collapsed'}">
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
    font: var(--rc-text-body1);
  }

  .rcb-product-title {
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-title3);
  }

  .rcb-product-price {
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-title2);
    margin: 12px 0px;
  }

  .rcb-product-price-frequency {
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-caption);
  }

  .rcb-product-price-monthly {
    color: var(--rc-color-grey-text-light);
    font: var(--rc-text-caption);
  }

  .rcb-product-description {
    color: var(--rc-color-grey-text-dark);
    margin: 0 0 12px 0;
  }

  .rcb-product-price-after-trial {
    margin-bottom: 12px;
  }

  .rcb-product-details {
    color: var(--rc-color-grey-text-light);
    list-style-type: disc;
    list-style-position: inside;

    margin: 0px;
    padding: 0px;

    overflow: hidden;
    max-height: 0;
    transition:
      max-height 0.1s ease-in-out,
      padding-top 0.1s ease-in-out,
      padding-bottom 0.1s ease-in-out;
  }

  .rcb-product-details.expanded {
    max-height: 500px;
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .rcb-product-details.collapsed {
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
  @media screen and (max-width: 960px) {
    .rcb-pricing-info {
      margin-top: 24px;
    }
  }
</style>
