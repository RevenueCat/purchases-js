<script module lang="ts">
  import { defineMeta, type StoryContext } from "@storybook/addon-svelte-csf";
  import type { ComponentProps } from "svelte";
  import { brandingModes } from "../../../.storybook/modes";
  import { renderInsideNavbarBody } from "../decorators/layout-decorators";
  import DiscountInput from "../../ui/molecules/discount-input.svelte";

  const noop = () => {};

  const { Story } = defineMeta({
    component: DiscountInput,
    title: "Molecules/DiscountInput",
    // @ts-ignore ignore typing of decorator
    decorators: [renderInsideNavbarBody],
    args: {
      onDiscountCodeChange: noop,
      onApplyDiscountCode: noop,
      onRemoveDiscountCode: noop,
    },
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
    // @ts-ignore ignore importing before initializing
    render: template,
  });

  type Args = ComponentProps<typeof DiscountInput>;
  type Context = StoryContext<typeof DiscountInput>;
</script>

{#snippet template(args: Args, _context: Context)}
  <DiscountInput
    showDiscountCodeField={args.showDiscountCodeField}
    discountCode={args.discountCode}
    appliedDiscountCode={args.appliedDiscountCode}
    discountCodeError={args.discountCodeError}
    isUpdatingDiscountCode={args.isUpdatingDiscountCode}
    isDiscountCodeControlsEnabled={args.isDiscountCodeControlsEnabled}
    onDiscountCodeChange={args.onDiscountCodeChange}
    onApplyDiscountCode={args.onApplyDiscountCode}
    onRemoveDiscountCode={args.onRemoveDiscountCode}
  />
{/snippet}

<Story
  name="Editable"
  args={{ showDiscountCodeField: true, isDiscountCodeControlsEnabled: true }}
/>

<Story
  name="With Draft Value"
  args={{
    showDiscountCodeField: true,
    discountCode: "SAVE10",
    isDiscountCodeControlsEnabled: true,
  }}
/>

<Story
  name="Applying"
  args={{
    showDiscountCodeField: true,
    discountCode: "SAVE10",
    isUpdatingDiscountCode: true,
    isDiscountCodeControlsEnabled: true,
  }}
/>

<Story
  name="Applied Code"
  args={{
    appliedDiscountCode: "SAVE10",
    isDiscountCodeControlsEnabled: true,
  }}
/>

<Story
  name="Applied Code Disabled"
  args={{
    appliedDiscountCode: "SAVE10",
    isDiscountCodeControlsEnabled: false,
  }}
/>

<Story
  name="Validation Error"
  args={{
    showDiscountCodeField: true,
    discountCode: "BADCODE",
    discountCodeError: "Invalid discount code.",
    isDiscountCodeControlsEnabled: true,
  }}
/>
