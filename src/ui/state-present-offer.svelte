<script lang="ts">
  import ModalSection from "./modal-section.svelte";
  import ProductDetails from "./product-details.svelte";
  import TermsList from "./terms-list.svelte";
  import {
    formatDuration,
    formatPrice,
    getRenewsLabel,
  } from "../helpers/price-labels";
  import ModalFooter from "./modal-footer.svelte";
  import Button from "./button.svelte";

  export let productDetails: any;
  export let onClose: any;
  export let onContinue: any;
</script>

<ModalSection>
  <ProductDetails productName={productDetails.displayName} />
</ModalSection>
<ModalSection>
  <TermsList
    terms={{
      Price: formatPrice(
        productDetails.currentPrice.amount,
        productDetails.currentPrice.currency,
      ),
      Duration: formatDuration(productDetails.normalPeriodDuration),
      Renews: getRenewsLabel(productDetails.normalPeriodDuration),
    }}
  />
</ModalSection>
<ModalFooter>
  <Button on:click={onContinue}>Subscribe</Button>
  <Button intent="secondary" on:click={onClose}>Cancel</Button>
</ModalFooter>
