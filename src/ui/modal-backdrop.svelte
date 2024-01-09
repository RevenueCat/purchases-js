<div class="rcb-modal-backdrop">
  <slot />
</div>

<style>
  .rcb-modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: transparent;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
  }
</style>
