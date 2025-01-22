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
    /* margin-right: auto;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    position: relative;
    padding: 0px 80px; */
    box-sizing: border-box;
  }

  /* @media screen and (max-width: 960px) {
    .rcb-ui-layout {
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-width: 100%;
      padding: 16px 0;
    }
  }

  @media screen and (max-width: 960px) and (max-height: 960px) {
    .rcb-ui-layout {
      overflow-y: scroll;
      justify-content: flex-start;
    }
  } */
</style>
