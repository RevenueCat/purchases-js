<script lang="ts">
  export let dark = false;
</script>

<main class={`rcb-modal-main ${dark ? "rcb-modal-dark" : ""}`}>
  <slot />
</main>

<style>
  .rcb-modal-main {
    box-sizing: border-box;
    border-radius: 0.5rem;
    background-color: #fff;
    color: black;
    max-width: 40rem;
    min-width: 30rem;
    overflow-y: auto;
    padding: 2.5rem;
  }

  .rcb-modal-dark {
    background-color: #000;
    color: #fff;
    max-width: 30rem;
    min-width: 20rem;
  }

  @media screen and (max-width: 60rem) {
    .rcb-modal-main,
    .rcb-modal-dark {
      max-width: 40rem;
      min-width: 90vw;
    }
  }
</style>
