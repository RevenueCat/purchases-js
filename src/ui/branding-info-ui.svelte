<script lang="ts">
  import AppIcon from "./app-icon.svelte";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import { buildAssetURL } from "../networking/assets";

  export let brandingInfo: BrandingInfoResponse | null = null;
</script>

<div class="rcb-header-layout__business-info">
  {#if brandingInfo !== null}
    {#if brandingInfo.app_icon_webp !== null && brandingInfo.app_icon !== null}
      <AppIcon
        src={buildAssetURL(brandingInfo.app_icon)}
        srcWebp={buildAssetURL(brandingInfo.app_icon_webp)}
      />
    {/if}
  {:else}
    <AppIcon />
  {/if}
</div>

<style>
  .rcb-header-layout__business-info {
    display: flex;
    align-items: center;
  }
</style>
