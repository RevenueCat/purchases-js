<script lang="ts">
  const { rcPackage, purchaseOption } = $props();
</script>

<div
  data-testid="express-purchase-button"
  data-package-id={rcPackage.identifier}
  data-purchase-option-id={purchaseOption.id}
>
  {rcPackage.identifier} - {purchaseOption.id}
</div>
