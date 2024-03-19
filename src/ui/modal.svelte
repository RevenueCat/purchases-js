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
    background-color: var(--rc-color-white);
    color: var(--rc-color-grey-text-dark);
    max-width: 640px;
    min-width: 480px;
    min-height: 460px;
    padding: 40px;
    flex-direction: column;
    display: flex;
  }

  .rcb-modal-dark {
    background-color: var(--rc-color-grey-text-dark);
    color: var(--rc-color-white);
    max-width: 480px;
    min-width: 320px;
    min-height: 0px;
  }

  @media screen and (max-width: 960px) {
    .rcb-modal-main,
    .rcb-modal-dark {
      min-width: 300px;
      max-width: 640px;
      width: calc(100% - 32px);
      padding: 32px;
    }
  }
</style>
