<script lang="ts">
  import ModalSection from "../modal-section.svelte";
  import Localized from "../localized.svelte";
  import { getRenewsLabel, getTrialsLabel } from "../../helpers/price-labels";
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
                    {getTrialsLabel(subscriptionTrial.periodDuration)} free trial
                {/if}
              {#if !subscriptionTrial?.periodDuration && subscriptionBasePrice }
                    {subscriptionBasePrice.formattedPrice}
                {/if}
            </span>
      {#if (subscriptionTrial && subscriptionBasePrice)}
                <span class="rcb-product-price-after-trial">
                    {subscriptionTrial && subscriptionBasePrice && `${
                      subscriptionBasePrice.formattedPrice} after end of trial`}
                </span>
      {/if}
      {#if brandingAppearance?.show_product_description && productDetails.description}
        <span class="rcb-product-description">{productDetails.description}</span>
      {/if}
      <ul class="rcb-product-details">
        {#if productDetails.normalPeriodDuration}
          <li>Renews {getRenewsLabel(productDetails.normalPeriodDuration)}</li>
        {/if}
        <li>
          <Localized>Continues until canceled</Localized>
        </li>
        <li>Cancel anytime</li>
      </ul>
    {/if}
    {#if !isSubscription}
      <span class="rcb-product-price">{nonSubscriptionBasePrice?.formattedPrice}</span>
      {#if brandingAppearance?.show_product_description}
        <span class="rcb-product-description">{productDetails.description}</span>
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
