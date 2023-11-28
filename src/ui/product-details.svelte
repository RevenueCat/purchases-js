<script lang="ts">
  export let productName: string;
</script>

<div class="product-details">
  <h2 class="product-title">{productName}</h2>
  <h3 class="subtitle">Subscription</h3>
</div>

<style>
  .product-details {
    display: flex;
    flex-direction: column;
  }

  .product-details h2 {
    margin-bottom: 0.25rem;
  }

  .product-details h3 {
    font-size: 0.75rem;
    text-transform: uppercase;
    margin: 0;
  }
</style>
