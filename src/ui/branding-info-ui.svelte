<script lang="ts">
  import AppIcon from "./app-icon.svelte";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import { buildAssetURL } from "../networking/assets";
  // import Localized from "./localization/localized.svelte";

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
    <!-- <span class="app-title">
      <Localized>{brandingInfo.app_name}</Localized>
    </span> -->
  {:else}
    <AppIcon />
  {/if}
</div>

<style>
  /* .app-title {
    font-weight: 500;
    margin: 8px 0;
    font-size: 16px;
  } */

  .rcb-header-layout__business-info {
    display: flex;
    align-items: center;
  }
</style>
