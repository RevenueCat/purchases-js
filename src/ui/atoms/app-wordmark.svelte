<script lang="ts">
  type Props = {
    src: string;
    srcWebp: string | null;
  };

  const { src, srcWebp }: Props = $props();
</script>

<picture class="rcb-app-icon">
  {#if srcWebp}
    <source type="image/webp" srcset={srcWebp} class="rcb-app-icon" />
  {/if}
  <img class="rcb-app-icon" {src} alt="App icon" />
</picture>

<style>
  .rcb-app-icon {
    height: 32px;
  }
</style>
