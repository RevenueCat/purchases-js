<script lang="ts">
  import { type Snippet } from "svelte";
  import { Theme } from "../theme/theme";

  import type { BrandingAppearance } from "../../entities/branding";
  import { BRANDED_FONT_NAME } from "../theme/text";
  import { buildAssetURL } from "../../networking/assets";
  import type { BrandFontConfig } from "../theme/text";

  const {
    brandingAppearance = undefined,
    brandFontConfig = undefined,
    isInElement = false,
    children,
  } = $props<{
    brandingAppearance: BrandingAppearance | null | undefined;
    brandFontConfig: BrandFontConfig | null | undefined;
    isInElement: boolean;
    children: Snippet;
  }>();

  // Make styles reactive to changes in brandingAppearance
  const textStyle = $derived(
    new Theme(brandingAppearance).getTextStyleVars(brandFontConfig),
  );
  const spacingStyle = $derived(new Theme(brandingAppearance).spacingStyleVars);
  const style = $derived([textStyle, spacingStyle].join("; "));
  const fontURL = $derived(
    brandFontConfig?.font_url ? buildAssetURL(brandFontConfig.font_url) : null,
  );

  const loadBrandFont = async (fontURL: string): Promise<void> => {
    try {
      const fontFace = new FontFace(BRANDED_FONT_NAME, `url(${fontURL})`);
      await fontFace.load();
      (document as any).fonts.add(fontFace);
    } catch (error) {
      console.error(`Failed to set brand font:`, error);
    }
  };

  $effect(() => {
    if (fontURL) {
      void loadBrandFont(fontURL);
    }
  });
</script>

<div
  class="rcb-ui-container"
  class:fullscreen={!isInElement}
  class:inside={isInElement}
  {style}
>
  {@render children?.()}
</div>

<style>
  .rcb-ui-container {
    display: flex;
    flex-direction: column;
    inset: 0;
    color-scheme: none;
    line-height: 1.5em;
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      avenir next,
      avenir,
      segoe ui,
      helvetica neue,
      helvetica,
      Cantarell,
      Ubuntu,
      roboto,
      noto,
      arial,
      sans-serif;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .rcb-ui-container.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overscroll-behavior: none;
    z-index: 1000001;
  }

  .rcb-ui-container.inside {
    position: relative;
    width: 100%;
    z-index: unset;
    height: 100%;
    top: 0;
    left: 0;
  }
</style>
