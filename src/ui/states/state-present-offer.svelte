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
    <span class="rcb-product-duration">
      Billed {getRenewsLabel(productDetails.normalPeriodDuration)}
    </span>
  </div>
</ModalSection>

<style>
  .rcb-pricing-info {
    display: flex;
    flex-direction: column;
    height: 160px;
    justify-content: flex-end;
  }

  .rcb-product-price {
    font-size: 24px;
  }

  .rcb-product-duration {
    opacity: 0.6;
  }
</style>
