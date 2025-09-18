<script module lang="ts">
  import AppLogo from "../../ui/atoms/app-logo.svelte";
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import { renderInsideMain } from "../decorators/layout-decorators";
  import { brandingModes } from "../../../.storybook/modes";
  import { brandingInfos } from "../fixtures";
  import { buildAssetURL } from "../../networking/assets";
  import type { ComponentProps } from "svelte";

  let { Story } = defineMeta({
    component: AppLogo,
    title: "Atoms/AppLogo",
    // @ts-expect-error ignore typing of decorator
    decorators: [renderInsideMain],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
    // @ts-expect-error ignore importing before initializing
    render: template,
  });
  type Args = ComponentProps<typeof AppLogo>;
  type Context = StoryContext<typeof AppLogo>;
</script>

{#snippet template(_args: Args, context: Context)}
  {@const isLoading = context.story === "Loading"}
  {@const brandingInfo = brandingInfos[context.globals.brandingName]}
  {@const src =
    brandingInfo?.app_icon && !isLoading
      ? buildAssetURL(brandingInfo?.app_icon)
      : null}
  {@const srcWebp =
    brandingInfo?.app_icon_webp && !isLoading
      ? buildAssetURL(brandingInfo?.app_icon_webp)
      : null}
  <AppLogo {src} {srcWebp} />
{/snippet}

<Story name="Default" />
<Story name="Loading" />
