<script module lang="ts">
  import FullscreenTemplate from "../../ui/layout/fullscreen-template.svelte";
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import { brandingInfos } from "../fixtures";
  import { mobileAndDesktopBrandingModes } from "../../../.storybook/modes";
  import type { ComponentProps } from "svelte";
  import Typography from "../../ui/atoms/typography.svelte";
  import Spinner from "../../ui/atoms/spinner.svelte";

  let { Story } = defineMeta({
    component: FullscreenTemplate,
    args: {
      isSandbox: false,
      isInElement: false,
    },
    parameters: {
      viewport: {
        defaultViewport: "mobile",
      },
      chromatic: {
        modes: mobileAndDesktopBrandingModes,
      },
    },
    title: "Layout/FullscreenTemplate",
    render: template,
  });
  type Args = ComponentProps<typeof FullscreenTemplate>;
  type Context = StoryContext<typeof FullscreenTemplate>;
</script>

{#snippet template(args: Args, context: Context)}
  {@const brandingInfo = brandingInfos[context.globals.brandingName]}
  <FullscreenTemplate
    {brandingInfo}
    isSandbox={args.isSandbox ?? false}
    isInElement={args.isInElement ?? false}
  >
    {#snippet mainContent()}
      <div
        style="text-align: center; display: flex; flex-direction: column; gap: 1rem; align-items: center;"
      >
        <Spinner />
        <Typography size="heading-md">Processing payment</Typography>
        <Typography size="body-base"
          >The process is almost done. Keep this tab open.</Typography
        >
      </div>
    {/snippet}
  </FullscreenTemplate>
{/snippet}

<Story name="Default" />

<Story
  name="With Loading Content"
  args={{ isSandbox: false, isInElement: false }}
/>

<Story
  name="With Simple Text Content"
  args={{ isSandbox: false, isInElement: false }}
>
  {#snippet template(args, context)}
    {@const brandingInfo = brandingInfos[context.globals.brandingName]}
    <FullscreenTemplate
      {brandingInfo}
      isSandbox={args.isSandbox ?? false}
      isInElement={args.isInElement ?? false}
    >
      {#snippet mainContent()}
        <div
          style="text-align: center; display: flex; flex-direction: column; gap: 1rem;"
        >
          <Typography size="heading-xl">Howdy</Typography>
          <Typography size="body-base">Purchase completed</Typography>
        </div>
      {/snippet}
    </FullscreenTemplate>
  {/snippet}
</Story>

<Story
  name="With Sandbox Banner"
  args={{ isSandbox: true, isInElement: false }}
/>

<Story
  name="In Element (Embedded)"
  args={{ isSandbox: false, isInElement: true }}
/>
