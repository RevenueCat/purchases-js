<script lang="ts">
  import AppLogo from "./app-logo.svelte";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import { buildAssetURL } from "../../networking/assets";

  export let brandingInfo: BrandingInfoResponse | null = null;

  const valueOrNull = (value: string | null | undefined) => {
    if (value == null) return null;
    if (value == undefined) return null;
    if (value == "") return null;

    return value;
  };

  const appIcon = valueOrNull(brandingInfo?.app_icon);
  const webpIcon = valueOrNull(brandingInfo?.app_icon_webp);
</script>

<div class="rcb-header-layout__business-info">
  {#if appIcon !== null && webpIcon !== null}
    <AppLogo src={buildAssetURL(appIcon)} srcWebp={buildAssetURL(webpIcon)} />
  {/if}

  <div class="rcb-app-name">
    {brandingInfo?.app_name}
  </div>
</div>

<style>
  .rcb-header-layout__business-info {
    display: flex;
    align-items: center;
  }

  .rcb-app-name {
    font: var(--rc-text-titleMedium-mobile);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-app-name {
      font: var(--rc-text-titleLarge-desktop);
    }
  }
</style>
