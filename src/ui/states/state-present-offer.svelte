<script lang="ts">
    import ModalSection from "../modal-section.svelte";
    import {formatPrice, getRenewsLabel} from "../../helpers/price-labels";
    import {SubscriptionPurchaseOption} from "../../entities/offerings";
    import {getTrialsLabel} from "../../helpers/price-labels.js";

    export let productDetails: any;
    export let purchaseOption: SubscriptionPurchaseOption;

</script>

<ModalSection>
    <div class="rcb-pricing-info">
        <span>{productDetails.displayName}</span>

        <span class="rcb-product-price">
            {purchaseOption.trial?.periodDuration && `${getTrialsLabel(purchaseOption.trial.periodDuration)} free trial`}
            {!purchaseOption.trial?.periodDuration && purchaseOption.basePrice.price && `${purchaseOption.basePrice.price?.currency || ''} ${formatPrice(
				purchaseOption.basePrice.price.amount,
				purchaseOption.basePrice.price.currency,
			)}`}
        </span>
        <span class="rcb-product-price-after-trial">
            {purchaseOption.trial && purchaseOption.basePrice.price && `${purchaseOption.basePrice.price.currency} ${formatPrice(
				purchaseOption.basePrice.price.amount,
				purchaseOption.basePrice.price.currency,
			)} after end of trial`}
        </span>
        <ul class="rcb-product-details">
            <li>Billed {getRenewsLabel(productDetails.normalPeriodDuration)}</li>
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
