<script>
  import { fly } from "svelte/transition";
  import { expoInOut } from "svelte/easing";

  const SLIDE_Y_COORDS = window.innerHeight;
</script>

<main
  class="rcb-modal-main"
  in:fly={{
    duration: 1500,
    easing: expoInOut,
    y: SLIDE_Y_COORDS,
  }}
  out:fly={{
    duration: 500,
    easing: expoInOut,
    y: SLIDE_Y_COORDS,
  }}
>
  <slot />
</main>

<style>
  .rcb-modal-main {
    border-radius: 0.5rem;
    background-color: #eee;
    color: black;
    max-width: 30rem;
    min-width: 20rem;
    min-height: 15rem;
    align-self: center;
    overflow-y: auto;

    box-shadow: 0 0 1rem rgba(0, 0, 0, 0.2);
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      avenir next,
      avenir,
      segoe ui,
      helvetica neue,
      helvetica,
      Cantarell,
      Ubuntu,
      roboto,
      noto,
      arial,
      sans-serif;
  }

  @media screen and (max-width: 40rem) {
    .rcb-modal-main {
      width: 100vw;
      border-radius: 0;
    }
  }
</style>
