<script lang="ts">
  import Container from "./container.svelte";
  import SandboxBanner from "../molecules/sandbox-banner.svelte";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import { type Snippet } from "svelte";
  import { Theme } from "../theme/theme";
  import type { BrandingAppearance } from "../../entities/branding";

  export interface Props {
    brandingInfo: BrandingInfoResponse | null;
    brandingAppearance?: BrandingAppearance | null;
    isInElement: boolean;
    isSandbox: boolean;
    mainContent?: Snippet<[]>;
    hideHeader?: boolean;
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

  const pageBackground = $derived(
    derivedBrandingAppearance?.color_page_bg ?? "#ffffff",
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
    style="{colorVariables}; background-color: {pageBackground}"
  >
    <div class="rcb-fullscreen-content">
      {@render mainContent?.()}
    </div>
  </div>
</Container>

<style>
  .rcb-fullscreen-wrapper {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .rcb-fullscreen-content {
    flex: 1;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--rc-color-grey-text-dark);
  }
</style>
