<script lang="ts">
  import { type Snippet } from "svelte";

  export let children: Snippet;
</script>

<footer class="rcb-modal-footer">
  {@render children?.()}
</footer>

<style>
  footer {
    display: flex;
    flex-direction: column;
  }
</style>
