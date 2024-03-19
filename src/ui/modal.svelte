<script lang="ts">
  export let dark = false;
</script>

<div class="rcb-modal-container">
  <main class={`rcb-modal-main ${dark ? "rcb-modal-dark" : ""}`}>
    <slot />
  </main>
</div>

<style>
  .rcb-modal-container {
    width: 100%;
  }

  .rcb-modal-main {
    box-sizing: border-box;
    border-radius: 8px;
    background-color: var(--rc-color-white);
    color: var(--rc-color-grey-text-dark);
    min-height: 460px;
    padding: 40px;
    flex-direction: column;
    display: flex;
  }

  .rcb-modal-dark {
    background-color: var(--rc-color-grey-text-dark);
    color: var(--rc-color-white);
    min-height: 0px;
  }

  @media screen and (max-width: 960px) {
    .rcb-modal-container {
      width: calc(100% - 32px);
      min-width: 300px;
      max-width: 640px;
      margin: auto;
    }
    .rcb-modal-main,
    .rcb-modal-dark {
      min-width: 300px;
      max-width: 640px;
      padding: 32px;
    }
  }
</style>
