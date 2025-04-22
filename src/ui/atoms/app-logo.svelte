<script lang="ts">
  type Props = {
    src: string | null;
    srcWebp: string | null;
  };

  const { src, srcWebp }: Props = $props();
</script>

{#if src}
  <picture class="rcb-app-icon-picture-container">
    {#if srcWebp}
      <source type="image/webp" srcset={srcWebp} />
    {/if}
    <img class="rcb-app-icon" {src} alt="App icon" />
  </picture>
{:else}
  <div class="rcb-app-icon loading"></div>
{/if}

<style>
  .rcb-app-icon {
    width: 32px;
    height: 32px;
    border-radius: 12px;
    box-shadow: 0px 1px 10px 0px rgba(0, 0, 0, 0.1);
    margin-right: 12px;
  }

  .rcb-app-icon-picture-container {
    height: 32px;
  }

  .rcb-app-icon.loading {
    background-color: gray;
  }
</style>
