<script lang="ts">
  import { type Snippet } from "svelte";

  export let style = "";
  export let children: Snippet;
</script>

<div id="layout-query-container">
  <div class="rcb-ui-layout" {style}>
    {@render children?.()}
  </div>
</div>

<style>
  #layout-query-container {
    width: 100%;
    height: 100%;
    container-type: size;
    container-name: layout-query-container;
    overflow-y: auto;
    overscroll-behavior: none;
  }

  .rcb-ui-layout {
    width: 100%;
    min-height: 100%;
    display: flex;
    box-sizing: border-box;
    flex-direction: column;
    overflow-y: auto;
    overscroll-behavior: none;
  }

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
