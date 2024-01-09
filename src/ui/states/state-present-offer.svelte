<script lang="ts">
  import ModalSection from "../modal-section.svelte";
  import { formatPrice, getRenewsLabel } from "../../helpers/price-labels";

  export let productDetails: any;
  export let onClose: any;
  export let onContinue: any;
</script>

<ModalSection>
  <div class="rcb-pricing-info">
    <p>{productDetails.displayName}</p>
    <p class="rcb-product-price">
      {productDetails.currentPrice.currency}{" "}{formatPrice(
        productDetails.currentPrice.amount,
        productDetails.currentPrice.currency,
      )}
    </p>
    <p class="rcb-product-duration">
      Billed {getRenewsLabel(productDetails.normalPeriodDuration)}
    </p>
  </div>
</ModalSection>

<style>
  p {
    margin-block-start: 0;
    margin-block-end: 0;
  }
  .rcb-pricing-info {
    display: flex;
    flex-direction: column;
    height: 10rem;
    justify-content: flex-end;
  }

  .rcb-product-price {
    font-size: 1.5rem;
    margin-top: 0.75rem;
  }

  .rcb-product-duration {
    opacity: 0.6;
    margin-top: 0.75rem;
  }
</style>
