<script>
  import { fade } from "svelte/transition";
  import { expoInOut } from "svelte/easing";
</script>

<div
  class="rcb-modal-backdrop"
  transition:fade={{ duration: 1250, easing: expoInOut }}
>
  <slot />
</div>

<style>
  .rcb-modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #0000004e;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
  }

  @media screen and (max-width: 40rem) {
    .rcb-modal-backdrop {
      justify-content: flex-end;
    }
  }
</style>
