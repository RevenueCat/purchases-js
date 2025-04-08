<script lang="ts">
  export let src: string | null = null;
  export let srcWebp: string | null = null;
</script>

{#if src !== null}
  <picture class="rcb-app-icon-picture-container">
    <source type="image/webp" srcset={srcWebp} />
    <img class="rcb-app-icon" {src} alt="App icon" />
  </picture>
{:else}
  <div class="rcb-app-icon loading"></div>
{/if}

<style>
  .rcb-app-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    box-shadow: 0px 1px 10px 0px rgba(0, 0, 0, 0.1);
    margin-right: 16px;
  }

  .rcb-app-icon-picture-container {
    height: 40px;
  }

  .rcb-app-icon.loading {
    background-color: gray;
  }
</style>
