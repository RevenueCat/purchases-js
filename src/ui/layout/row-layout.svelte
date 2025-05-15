<script lang="ts">
  import { type Snippet } from "svelte";
  export let children: Snippet;
</script>

<div class="rcb-row">
  {@render children?.()}
</div>

<style>
  .rcb-row {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
  }
</style>
