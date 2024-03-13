<script lang="ts">
  import ModalSection from "../modal-section.svelte";
  import { formatPrice, getRenewsLabel } from "../../helpers/price-labels";

  export let productDetails: any;
</script>

<ModalSection>
  <div class="rcb-pricing-info">
    <span>{productDetails.displayName}</span>
    <span class="rcb-product-price">
      {productDetails.currentPrice.currency}{" "}{formatPrice(
        productDetails.currentPrice.amount,
        productDetails.currentPrice.currency,
      )}
    </span>
    <ul class="rcb-product-details">
      <li>Billed {getRenewsLabel(productDetails.normalPeriodDuration)}</li>
      <li>Plan continues until cancelled</li>
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
