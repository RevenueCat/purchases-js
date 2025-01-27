<script lang="ts">
  import { type Snippet } from "svelte";

  export let children: Snippet;
</script>

<div class="rcb-modal-backdrop">
  {@render children?.()}
</div>

<style>
  .rcb-modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    min-width: 100%;
    width: 100vw;
    width: 100dvw;
    min-height: 100%;
    height: 100vh;
    height: 100dvh;
    background-color: rgba(40, 40, 40, 0.75);
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    z-index: 1000001;
  }
</style>
