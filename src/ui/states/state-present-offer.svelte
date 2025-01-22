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
      {#if expanded}
        <ul class="rcb-product-details">
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
    /* margin-top: 102px; */
    font-weight: 500;
  }

  .rcb-product-title {
    color: var(--rc-color-grey-text-dark);
    font-size: 24px;
  }

  .rcb-product-price {
    color: var(--rc-color-grey-text-dark);
    font-size: 24px;
    margin: 12px 0px;
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
  }

  @media screen and (max-width: 960px) {
    .rcb-pricing-info {
      margin-top: 24px;
    }
  }
</style>
