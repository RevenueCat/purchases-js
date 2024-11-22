<script lang="ts">
  import ModalSection from "../modal-section.svelte";
  import Localized from "../localization/localized.svelte";
  import { getPeriodLabel, getRenewalFrequency, getTrialsLabel } from "../../helpers/price-labels";
  import {
    type NonSubscriptionOption,
    type Product,
    ProductType,
    type PurchaseOption,
    type SubscriptionOption,
  } from "../../entities/offerings";
  import { type BrandingAppearance } from "../../networking/responses/branding-response";

  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;
  export let brandingAppearance: BrandingAppearance | undefined = undefined;
  export let selectedLocale: string;
  const isSubscription = productDetails.productType === ProductType.Subscription;
  const subscriptionOption: SubscriptionOption | null | undefined =
    purchaseOption as SubscriptionOption;
  const nonSubscriptionOption: NonSubscriptionOption | null | undefined =
    purchaseOption as NonSubscriptionOption;
  const subscriptionTrial = subscriptionOption?.trial;

  const subscriptionBasePrice = subscriptionOption?.base?.price;
  const nonSubscriptionBasePrice = nonSubscriptionOption?.basePrice;
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
                      trialDuration: getPeriodLabel(subscriptionTrial.periodDuration,selectedLocale),
                    }}
                    selectedLocale={selectedLocale}
                  />
                {/if}
              {#if !subscriptionTrial?.periodDuration && subscriptionBasePrice }
                  <Localized>{subscriptionBasePrice.formattedPrice}</Localized>
              {/if}

            </span>
      {#if (subscriptionTrial && subscriptionBasePrice)}
                <span class="rcb-product-price-after-trial">
                  <Localized
                    labelId="state_present_offer.price_after_free_trial"
                    variables={{
                      formattedPrice: subscriptionTrial && subscriptionBasePrice &&
                      subscriptionBasePrice.formattedPrice,
                    }}
                    selectedLocale={selectedLocale}
                  >
                    {subscriptionTrial && subscriptionBasePrice && `${
                      subscriptionBasePrice.formattedPrice} after end of trial`}
                    </Localized>
                </span>
      {/if}
      {#if brandingAppearance?.show_product_description && productDetails.description}
        <span class="rcb-product-description">
          <Localized>{productDetails.description}</Localized>
        </span>
      {/if}
      <ul class="rcb-product-details">
        {#if productDetails.normalPeriodDuration}
          <li>
            <Localized
              labelId="state_present_offer.renewal_frequency"
              variables={{
                      frequency: getRenewalFrequency(productDetails.normalPeriodDuration, selectedLocale)
               }}
              selectedLocale={selectedLocale}
            />
          </li>
        {/if}
        <li>
          <Localized labelId="state_present_offer.continues_until_cancelled" selectedLocale={selectedLocale} />
        </li>
        <li>
          <Localized labelId="state_present_offer.cancel_anytime" selectedLocale={selectedLocale} />
        </li>
      </ul>
    {/if}
    {#if !isSubscription}
      <span class="rcb-product-price">
        <Localized>
          {nonSubscriptionBasePrice?.formattedPrice}
        </Localized>
      </span>

      {#if brandingAppearance?.show_product_description}
        <span class="rcb-product-description">
          <Localized>
            <!-- We do not have localized descriptions -->
            {productDetails.description}
          </Localized>
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
