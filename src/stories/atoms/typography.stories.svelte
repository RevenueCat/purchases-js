<script module lang="ts">
  import Typography from "../../ui/atoms/typography.svelte";
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import { renderInsideMain } from "../decorators/layout-decorators";
  import { brandingModes } from "../../../.storybook/modes";
  import type { ComponentProps } from "svelte";

  let { Story } = defineMeta({
    component: Typography,
    title: "Atoms/Typography",
    // @ts-expect-error ignore typing of decorator
    decorators: [renderInsideMain],
    argTypes: {
      size: {
        control: "select",
        options: [
          "heading-2xl",
          "heading-xl",
          "heading-lg",
          "heading-md",
          "body-base",
          "body-small",
          "label-button",
          "label-default",
          "caption-default",
          "caption-link",
        ],
      },
    },
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
    // @ts-expect-error ignore importing before initializing
    render: template,
  });

  const baseContent = "The quick brown fox jumps over the lazy dog";
  type Args = ComponentProps<typeof Typography>;
  type Context = StoryContext<typeof Typography>;
</script>

{#snippet template(args: Args, _context: Context)}
  <Typography size={args.size}>
    {#snippet children()}
      Default text
    {/snippet}
  </Typography>
{/snippet}

<!-- Stories for each typography variant -->
<Story name="Heading 2XL">
  <Typography size="heading-2xl">
    Heading 2XL - {baseContent}
  </Typography>
</Story>

<Story name="Heading XL">
  <Typography size="heading-xl">
    Heading XL - {baseContent}
  </Typography>
</Story>

<Story name="Heading LG">
  <Typography size="heading-lg">
    Heading LG - {baseContent}
  </Typography>
</Story>

<Story name="Heading MD">
  <Typography size="heading-md">
    Heading MD - {baseContent}
  </Typography>
</Story>

<Story name="Body Base">
  <Typography size="body-base">
    Body Base - {baseContent}
  </Typography>
</Story>

<Story name="Body Small">
  <Typography size="body-small">
    Body Small - {baseContent}
  </Typography>
</Story>

<Story name="Label Button">
  <Typography size="label-button">
    Label Button - {baseContent}
  </Typography>
</Story>

<Story name="Label Default">
  <Typography size="label-default">
    Label Default - {baseContent}
  </Typography>
</Story>

<Story name="Caption Default">
  <Typography size="caption-default">
    Caption Default - {baseContent}
  </Typography>
</Story>

<Story name="Caption Link">
  <Typography size="caption-link">
    Caption Link - {baseContent}
  </Typography>
</Story>

<Story name="Branded">
  <Typography size="heading-xl" branded>
    Branded - {baseContent}
  </Typography>
</Story>

<!-- Story showing all variants -->
<Story name="All Variants">
  <div class="story-container">
    <div class="variant-row">
      <div class="variant-name">heading-2xl</div>
      <Typography size="heading-2xl">
        Heading 2XL - {baseContent}
      </Typography>
    </div>
    <div class="variant-row">
      <div class="variant-name">heading-xl</div>
      <Typography size="heading-xl">
        Heading XL - {baseContent}
      </Typography>
    </div>
    <div class="variant-row">
      <div class="variant-name">heading-lg</div>
      <Typography size="heading-lg">
        Heading LG - {baseContent}
      </Typography>
    </div>
    <div class="variant-row">
      <div class="variant-name">heading-md</div>
      <Typography size="heading-md">
        Heading MD - {baseContent}
      </Typography>
    </div>
    <div class="variant-row">
      <div class="variant-name">body-base</div>
      <Typography size="body-base">
        Body Base - {baseContent}
      </Typography>
    </div>
    <div class="variant-row">
      <div class="variant-name">body-small</div>
      <Typography size="body-small">
        Body Small - {baseContent}
      </Typography>
    </div>
    <div class="variant-row">
      <div class="variant-name">label-button</div>
      <Typography size="label-button">
        Label Button - {baseContent}
      </Typography>
    </div>
    <div class="variant-row">
      <div class="variant-name">label-default</div>
      <Typography size="label-default">
        Label Default - {baseContent}
      </Typography>
    </div>
    <div class="variant-row">
      <div class="variant-name">caption-default</div>
      <Typography size="caption-default">
        Caption Default - {baseContent}
      </Typography>
    </div>
    <div class="variant-row">
      <div class="variant-name">caption-link</div>
      <Typography size="caption-link">
        Caption Link - {baseContent}
      </Typography>
    </div>
    <div class="variant-row">
      <div class="variant-name">Brand Custom Font</div>
      <Typography size="heading-xl" branded>
        Brand Custom Font - {baseContent}
      </Typography>
    </div>
  </div>
</Story>

<style>
  .story-container {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .variant-row {
    display: grid;
    grid-template-columns: 200px 1fr;
    align-items: center;
    gap: 1rem;
  }

  .variant-name {
    color: #666;
    font-family: monospace;
    font-size: 14px;
  }
</style>
