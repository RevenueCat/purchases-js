<script lang="ts">
  import Container from "./container.svelte";
  import SandboxBanner from "../molecules/sandbox-banner.svelte";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import { type Snippet } from "svelte";
  import { toProductInfoStyleVar } from "../theme/utils";
  import AppWordmark from "../atoms/app-wordmark.svelte";
  import { buildBrandingSources } from "../../helpers/build-branding-sources";
  import AppLogo from "../atoms/app-logo.svelte";
  import Typography from "../atoms/typography.svelte";

  export interface Props {
    brandingInfo: BrandingInfoResponse | null;
    isInElement: boolean;
    isSandbox: boolean;
    mainContent?: Snippet<[]>;
  }

  const { brandingInfo, isInElement, isSandbox, mainContent }: Props = $props();

  const colorVariables = $derived(
    toProductInfoStyleVar(brandingInfo?.appearance) ?? "",
  );

  const pageBgColor = $derived(
    brandingInfo?.appearance?.color_page_bg ?? "#ffffff",
  );

  const { wordmarkSrc, wordmarkSrcWebp, src, srcWebp } = $derived(
    buildBrandingSources(brandingInfo),
  );
</script>

<Container
  brandingAppearance={brandingInfo?.appearance}
  brandFontConfig={brandingInfo?.brand_font_config}
  {isInElement}
>
  {#if isSandbox}
    <SandboxBanner style={colorVariables} {isInElement} {brandingInfo} />
  {/if}
  <div
    class="rcb-fullscreen-wrapper"
    style="{colorVariables}; background-color: {pageBgColor}"
  >
    <div class="rcb-fullscreen-header">
      {#if wordmarkSrc !== null}
        <AppWordmark src={wordmarkSrc} srcWebp={wordmarkSrcWebp} />
      {:else if src !== null && srcWebp !== null}
        <AppLogo {src} {srcWebp} />
      {:else if brandingInfo?.app_name}
        <Typography size="body-base">{brandingInfo.app_name}</Typography>
      {/if}
    </div>
    <div class="rcb-fullscreen-content">
      {@render mainContent?.()}
    </div>
  </div>
</Container>

<style>
  .rcb-fullscreen-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: auto;
    overscroll-behavior: none;
  }

  .rcb-fullscreen-header {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: var(--rc-spacing-outerPadding-mobile);
    padding-bottom: var(--rc-spacing-gapMedium-mobile);
    flex-shrink: 0;
  }

  .rcb-fullscreen-content {
    flex: 1;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-left: var(--rc-spacing-outerPadding-mobile);
    padding-right: var(--rc-spacing-outerPadding-mobile);
    padding-bottom: var(--rc-spacing-outerPadding-mobile);
    color: var(--rc-color-grey-text-dark);
  }

  @media (min-width: 768px) {
    .rcb-fullscreen-header {
      padding-top: var(--rc-spacing-outerPadding-desktop);
      padding-bottom: var(--rc-spacing-gapMedium-desktop);
    }

    .rcb-fullscreen-content {
      padding-left: var(--rc-spacing-outerPadding-desktop);
      padding-right: var(--rc-spacing-outerPadding-desktop);
      padding-bottom: var(--rc-spacing-outerPadding-desktop);
    }
  }
</style>
