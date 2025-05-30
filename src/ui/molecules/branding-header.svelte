<script lang="ts">
  import AppLogo from "../atoms/app-logo.svelte";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import { buildAssetURL } from "../../networking/assets";
  import Typography from "../atoms/typography.svelte";
  import BackButton from "./back-button.svelte";
  import CloseButton from "./close-button.svelte";
  import AppWordmark from "../atoms/app-wordmark.svelte";

  type Props = {
    brandingInfo: BrandingInfoResponse | null;
    showCloseButton: boolean;
    onClose?: (() => void) | undefined;
  };

  const { brandingInfo, showCloseButton, onClose }: Props = $props();

  const valueOrNull = (value: string | null | undefined) => {
    if (value == null) return null;
    if (value == undefined) return null;
    if (value == "") return null;

    return value;
  };

  const appIcon = $derived(valueOrNull(brandingInfo?.app_icon));
  const webpIcon = $derived(valueOrNull(brandingInfo?.app_icon_webp));
  const appWordmark = $derived(valueOrNull(brandingInfo?.app_wordmark));
  const webpWordmark = $derived(valueOrNull(brandingInfo?.app_wordmark_webp));

  const src = $derived(appIcon ? buildAssetURL(appIcon) : null);
  const srcWebp = $derived(webpIcon ? buildAssetURL(webpIcon) : null);
  const wordmarkSrc = $derived(appWordmark ? buildAssetURL(appWordmark) : null);
  const wordmarkSrcWebp = $derived(
    webpWordmark ? buildAssetURL(webpWordmark) : null,
  );

  const handleCloseClick = () => {
    onClose && onClose();
  };
</script>

<div class="rcb-header-wrapper" class:rcb-with-close-button={showCloseButton}>
  {#if showCloseButton}
    <div class="rcb-back-wrapper">
      <BackButton on:click={handleCloseClick} />
    </div>
  {/if}

  <div class="rcb-header">
    <div class="rcb-title">
      {#if wordmarkSrc !== null}
        <AppWordmark src={wordmarkSrc} srcWebp={wordmarkSrcWebp} />
      {:else if src !== null && srcWebp !== null}
        <AppLogo {src} {srcWebp} />
      {/if}

      {#if wordmarkSrc === null}
        <Typography size="body-base">{brandingInfo?.app_name}</Typography>
      {/if}
    </div>
  </div>

  {#if showCloseButton}
    <div class="rcb-close-wrapper">
      <CloseButton on:click={handleCloseClick} />
    </div>
  {/if}
</div>

<style>
  .rcb-header-wrapper {
    display: flex;
    position: relative;
    justify-content: space-between;
    align-items: center;
  }

  .rcb-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-top: var(--rc-spacing-gapSmall-mobile);
    padding-bottom: var(--rc-spacing-gapSmall-mobile);
    height: 40px;
    justify-content: space-between;
  }

  .rcb-title {
    display: flex;
    align-items: center;
    position: relative;
    gap: var(--rc-spacing-gapMedium-mobile);
  }

  .rcb-close-wrapper,
  .rcb-back-wrapper {
    padding: var(--rc-spacing-gapSmall-mobile);
  }

  @container layout-query-container (width < 768px) {
    .rcb-header {
      padding-top: var(--rc-spacing-gapMedium-mobile);
    }

    .rcb-close-wrapper {
      padding-top: var(--rc-spacing-gapMedium-mobile);
    }

    .rcb-header-wrapper {
      padding-top: var(--rc-spacing-gapSmall-mobile);
      padding-bottom: var(--rc-spacing-gapSmall-mobile);
      padding-left: var(--rc-spacing-outerPadding-mobile);
      padding-right: var(--rc-spacing-outerPadding-mobile);
    }

    .rcb-header-wrapper.rcb-with-close-button {
      padding-right: var(--rc-spacing-gapSmall-mobile);
    }

    .rcb-back-wrapper {
      display: none;
    }

    .rcb-header-wrapper {
      padding-left: var(--rc-spacing-outerPadding-mobile);
      padding-right: var(--rc-spacing-outerPadding-mobile);
    }
  }

  @container layout-query-container (width >= 768px) {
    .rcb-close-wrapper {
      display: none;
    }

    .rcb-back-wrapper {
      position: absolute;
      left: -48px;
      margin-left: 0;
    }
  }
</style>
