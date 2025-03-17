<script module>
  import { default as AppLogo } from "../../ui/atoms/app-logo.svelte";
  import {
    type Args,
    defineMeta,
    setTemplate,
    type StoryContext,
  } from "@storybook/addon-svelte-csf";
  import { withLayout } from "../decorators/with-layout";
  import { brandingModes } from "../../../.storybook/modes";
  import { brandingInfos } from "../fixtures";
  import { buildAssetURL } from "../../networking/assets";

  let { Story } = defineMeta({
    component: AppLogo,
    title: "Atoms/AppLogo",
    // @ts-expect-error ignore typing of decorator
    decorators: [withLayout],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });
</script>

<script lang="ts">
  setTemplate(template);
</script>

{#snippet template(
  _args: Args<typeof Story>,
  context: StoryContext<typeof Story>,
)}
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
