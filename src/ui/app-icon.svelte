<script lang="ts">
  export let src: string | null = null;
  export let srcWebp: string | null = null;
</script>

{#if src !== null}
  <picture class="rcb-app-icon-picture-container">
    <source type="image/webp" srcset={srcWebp} />
    <img class="rcb-app-icon" src={src} alt="App icon" />
  </picture>
{:else}
  <div class="rcb-app-icon loading" />
{/if}

<style>
  .rcb-app-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.75rem;
    box-shadow: 0px 1px 10px 0px rgba(0, 0, 0, 0.1);
    margin-right: 1rem;
  }

  .rcb-app-icon-picture-container {
    height: 2.5rem;
  }

  .rcb-app-icon.loading {
    background-color: gray;
  }
</style>
