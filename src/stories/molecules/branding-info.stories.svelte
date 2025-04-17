<script module>
  import BrandingInfo from "../../ui/molecules/branding-info.svelte";
  import {
    type Args,
    defineMeta,
    setTemplate,
    type StoryContext,
  } from "@storybook/addon-svelte-csf";
  import { brandingInfos } from "../fixtures";
  import { withNavbar } from "../decorators/with-navbar";
  import { mobileAndDesktopBrandingModes } from "../../../.storybook/modes";

  let { Story } = defineMeta({
    component: BrandingInfo,
    // @ts-expect-error ignore typing of decorator
    decorators: [withNavbar],
    parameters: {
      chromatic: {
        modes: mobileAndDesktopBrandingModes,
      },
    },
    title: "Molecules/Branding Info",
  });
</script>

<script lang="ts">
  setTemplate(template);
</script>

{#snippet template(
  _args: Args<typeof Story>,
  context: StoryContext<typeof Story>,
)}
  {@const brandingInfo = brandingInfos[context.globals.brandingName]}
  <BrandingInfo {brandingInfo} />
{/snippet}

<Story name="Default" />
