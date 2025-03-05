<script lang="ts">
  import { type Snippet } from "svelte";

  export let style = "";
  export let children: Snippet;
  export let isInElement: boolean = false;
</script>

<div id="layout-query-container" class:isEmbedded={isInElement}>
  <div class="rcb-ui-layout" {style}>
    {@render children?.()}
  </div>
</div>

<style>
  #layout-query-container {
    width: 100%;
    height: 1000px;
    position: relative;
  }

  #layout-query-container.isEmbedded {
    container-type: size;
    container-name: layout-query-container;
  }

  .rcb-ui-layout {
    width: 100%;
    min-height: 100%;
    display: flex;
    box-sizing: border-box;
    flex-direction: column;
  }

  /* Leverage container queries */
  @container layout-query-container (width < 768px) {
    .rcb-ui-layout {
      flex-grow: 1;
    }
  }

  @container layout-query-container (width >= 768px) {
    .rcb-ui-layout {
      flex-direction: row;
    }
  }
</style>
