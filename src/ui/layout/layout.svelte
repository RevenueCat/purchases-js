<script lang="ts">
  import { type Snippet } from "svelte";

  export let style = "";
  export let children: Snippet;
</script>

<div class="rcb-ui-layout" {style}>
  {@render children?.()}
</div>

<style>
  .rcb-ui-layout {
    width: 100vw;
    display: flex;
    box-sizing: border-box;
    flex-direction: column;
  }

  @media screen and (max-width: 767px) {
    .rcb-ui-layout {
      flex-grow: 1;
    }
  }

  @media screen and (min-width: 768px) {
    .rcb-ui-layout {
      flex-direction: row;
    }
  }
</style>
