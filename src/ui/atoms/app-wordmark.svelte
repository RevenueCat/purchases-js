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
  <div class="rcb-app-wordmark loading"></div>
{/if}

<style>
  .rcb-app-wordmark {
    width: 100%;
    height: 32px;
    box-shadow: 0px 1px 10px 0px rgba(0, 0, 0, 0.1);
  }

  .rcb-app-icon {
    height: 32px;
  }

  .rcb-app-wordmark.loading {
    background-color: gray;
  }
</style>
