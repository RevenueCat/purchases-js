<script lang="ts">
  import Container from "./container.svelte";
  import SandboxBanner from "../molecules/sandbox-banner.svelte";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import { type Snippet } from "svelte";
  import { Theme } from "../theme/theme";
  import AppWordmark from "../atoms/app-wordmark.svelte";
  import { buildBrandingSources } from "../../helpers/build-branding-sources";
  import AppLogo from "../atoms/app-logo.svelte";
  import Typography from "../atoms/typography.svelte";
  import type { BrandingAppearance } from "../../entities/branding";

  export interface Props {
    brandingInfo: BrandingInfoResponse | null;
    brandingAppearance?: BrandingAppearance | null;
    isInElement: boolean;
    isSandbox: boolean;
    mainContent?: Snippet<[]>;
  }

  const {
    brandingInfo,
    brandingAppearance,
    isInElement,
    isSandbox,
    mainContent,
  }: Props = $props();

  const derivedBrandingAppearance = $derived(
    brandingAppearance ?? brandingInfo?.appearance ?? null,
  );

  const colorVariables = $derived(
    new Theme(derivedBrandingAppearance).pageStyleVars,
  );

  const pageBgColor = $derived(
    derivedBrandingAppearance?.color_page_bg ?? "#ffffff",
  );

  const { wordmarkSrc, wordmarkSrcWebp, src, srcWebp } = $derived(
    buildBrandingSources(brandingInfo),
  );
</script>

<Container
  brandingAppearance={derivedBrandingAppearance}
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
    <div class="rcb-fullscreen-header" class:static-header={isInElement}>
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
  }

  .rcb-fullscreen-header {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: var(--rc-spacing-gapXXLarge-mobile);
    padding-bottom: var(--rc-spacing-gapMedium-mobile);
    flex-shrink: 0;
    position: absolute;
  }

  .rcb-fullscreen-header.static-header {
    position: static;
  }

  .rcb-fullscreen-content {
    flex: 1;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 var(--rc-spacing-outerPadding-mobile)
      var(--rc-spacing-outerPadding-mobile);
    color: var(--rc-color-grey-text-dark);
  }

  /* On short screens, don't position the header on top of the content */
  @media (max-height: 500px) {
    .rcb-fullscreen-header {
      position: static;
    }
  }

  @media (min-width: 768px) {
    .rcb-fullscreen-header {
      padding-top: var(--rc-spacing-gapXXLarge-desktop);
    }

    .rcb-fullscreen-content {
      padding: 0 var(--rc-spacing-outerPadding-desktop)
        var(--rc-spacing-outerPadding-desktop);
    }
  }
</style>
