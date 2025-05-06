<script lang="ts">
  type Props = {
    src: string | null;
    srcWebp: string | null;
  };

  const { src, srcWebp }: Props = $props();
</script>

{#if src}
  <picture class="rcb-app-icon">
    {#if srcWebp}
      <source type="image/webp" srcset={srcWebp} class="rcb-app-icon" />
    {/if}
    <img class="rcb-app-icon" {src} alt="App icon" />
  </picture>
{/if}

<style>
  .rcb-app-icon {
    height: 32px;
  }
</style>
