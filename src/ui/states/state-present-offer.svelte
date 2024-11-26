<script lang="ts">
  import ModalSection from "../modal-section.svelte";
  import Localized from "../localization/localized.svelte";
  import { getTranslatedPeriodFrequency, getTranslatedPeriodLength } from "../../helpers/price-labels";
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

  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;
  export let brandingAppearance: BrandingAppearance | undefined = undefined;

  const isSubscription = productDetails.productType === ProductType.Subscription;
  const subscriptionOption: SubscriptionOption | null | undefined =
    purchaseOption as SubscriptionOption;
  const nonSubscriptionOption: NonSubscriptionOption | null | undefined =
    purchaseOption as NonSubscriptionOption;
  const subscriptionTrial = subscriptionOption?.trial;

  const subscriptionBasePrice = subscriptionOption?.base?.price;
  const nonSubscriptionBasePrice = nonSubscriptionOption?.basePrice;

  const translator: Translator = getContext(translatorContextKey) || Translator.fallback();
</script>

<ModalSection>
  <div class="rcb-pricing-info">
    <span class="rc-product-title">{productDetails.title}</span>

    {#if isSubscription}
            <span class="rcb-product-price">

                {#if subscriptionTrial?.periodDuration}
                  <Localized
                    labelId="state_present_offer.free_trial_duration"
                    variables={{
                      trialDuration: getTranslatedPeriodLength(subscriptionTrial.periodDuration, translator),
                    }}
                  />
                {/if}
              {#if !subscriptionTrial?.periodDuration && subscriptionBasePrice }
                  <Localized
                    labelId="state_present_offer.price_after_free_trial"
                    variables={{
                      productPrice: subscriptionBasePrice.formattedPrice,
                    }}
                  />
              {/if}

            </span>
      {#if (subscriptionTrial && subscriptionBasePrice)}
                <span class="rcb-product-price-after-trial">
                  <Localized
                    labelId="state_present_offer.price_after_free_trial"
                    variables={{
                      productPrice: subscriptionTrial && subscriptionBasePrice &&
                      subscriptionBasePrice.formattedPrice,
                    }}
                  />
                </span>
      {/if}
      {#if brandingAppearance?.show_product_description && productDetails.description}
        <span class="rcb-product-description">
          <Localized
            labelID="state_present_offer.product_description"
            variables={{
              productDescription:productDetails.description
            }}
          />
        </span>
      {/if}
      <ul class="rcb-product-details">
        {#if productDetails.normalPeriodDuration}
          <li>
            <Localized
              labelId="state_present_offer.renewal_frequency"
              variables={{
                      frequency: getTranslatedPeriodFrequency(productDetails.normalPeriodDuration, translator)
               }}
            />
          </li>
        {/if}
        <li>
          <Localized labelId="state_present_offer.continues_until_cancelled" />
        </li>
        <li>
          <Localized labelId="state_present_offer.cancel_anytime" />
        </li>
      </ul>
    {/if}
    {#if !isSubscription}
      <span class="rcb-product-price">
        <Localized
          labelId="state_present_offer.product_price"
          variables={{productPrice:nonSubscriptionBasePrice?.formattedPrice}} />
      </span>

      {#if brandingAppearance?.show_product_description}
        <span class="rcb-product-description">
          <Localized
            labelId={`state_present_offer.product_description`}
            variables={{productDescription:productDetails.description}}
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
        margin-top: 102px;
        font-weight: 500;
    }

    .rcb-product-title {
        color: var(--rc-color-grey-text-dark);
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
            margin-top: 48px;
        }
    }
</style>
