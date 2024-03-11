<div class="rcb-modal-backdrop">
  <slot />
</div>

<style>
  .rcb-modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    width: max(100vw, 100%);
    height: 100vh;
    height: max(100vh, 100%);
    background-color: rgba(40, 40, 40, 0.75);
    display: flex;
    flex-direction: column;
    justify-content: space-around;
  }
</style>
