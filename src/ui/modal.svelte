<script lang="ts">
  export let dark = false;
</script>

<main class={`rcb-modal-main ${dark ? "rcb-modal-dark" : ""}`}>
  <slot />
</main>

<style>
  .rcb-modal-main {
    box-sizing: border-box;
    border-radius: 8px;
    background-color: #fff;
    color: black;
    max-width: 640px;
    min-width: 480px;
    overflow-y: auto;
    padding: 40px;
  }

  .rcb-modal-dark {
    background-color: #000;
    color: #fff;
    max-width: 480px;
    min-width: 320px;
  }

  @media screen and (max-width: 960px) {
    .rcb-modal-main,
    .rcb-modal-dark {
      max-width: 640px;
      min-width: 90vw;
    }
  }
</style>
