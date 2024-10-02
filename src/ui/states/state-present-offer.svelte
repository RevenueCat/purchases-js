<script lang="ts">
    import ModalSection from "../modal-section.svelte";
    import { getRenewsLabel, getTrialsLabel } from "../../helpers/price-labels";
    import {
        type NonSubscriptionOption,
        type Product,
        ProductType,
        type PurchaseOption,
        type SubscriptionOption,
    } from "../../entities/offerings";

    export let productDetails: Product;
    export let purchaseOption: PurchaseOption;

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
        <span>{productDetails.title}</span>

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
            <ul class="rcb-product-details">
                {#if productDetails.normalPeriodDuration}
                    <li>Renews {getRenewsLabel(productDetails.normalPeriodDuration)}</li>
                {/if}
                <li>Continues until canceled</li>
                <li>Cancel anytime</li>
            </ul>
        {/if}
        {#if !isSubscription}
            <span class="rcb-product-price">{nonSubscriptionBasePrice?.formattedPrice}</span>
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

    .rcb-product-price {
        font-size: 24px;
        margin: 12px 0px;
    }

    .rcb-product-price-after-trial {
        margin-bottom: 12px;
    }

    .rcb-product-details {
        opacity: 0.6;
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
