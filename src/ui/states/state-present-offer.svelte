<script lang="ts">
    import ModalSection from "../modal-section.svelte";
    import {formatPrice, getRenewsLabel} from "../../helpers/price-labels";
    import {getTrialsLabel} from "../../helpers/price-labels.js";
    import type { Product, PurchaseOption, SubscriptionOption } from "../../entities/offerings";

    export let productDetails: Product;
    export let purchaseOption: PurchaseOption;

    const subscriptionOption: SubscriptionOption | null | undefined =
      purchaseOption as SubscriptionOption;
    const trial = subscriptionOption?.trial;
    const basePrice = subscriptionOption?.base?.price;
</script>

<ModalSection>
    <div class="rcb-pricing-info">
        <span>{productDetails.displayName}</span>

        <span class="rcb-product-price">
            {#if trial?.periodDuration}
                {getTrialsLabel(trial.periodDuration)} free trial
            {/if}
            {#if !trial?.periodDuration && basePrice }
                {basePrice.currency || ''} {formatPrice(
                    basePrice.amount,
                    basePrice.currency,
                )}
            {/if}

        </span>
        {#if (trial && basePrice)}
            <span class="rcb-product-price-after-trial">
                {trial && basePrice && `${basePrice.currency} ${formatPrice(
                  basePrice.amount,
                  basePrice.currency,
                )} after end of trial`}
            </span>
        {/if}
        <ul class="rcb-product-details">
            {#if productDetails.normalPeriodDuration}
                <li>Renews {getRenewsLabel(productDetails.normalPeriodDuration)}</li>
            {/if}
            <li>Continues until canceled</li>
            <li>Cancel anytime</li>
        </ul>
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
