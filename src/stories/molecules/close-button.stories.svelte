<script module>
  import CloseButton from "../../ui/molecules/close-button.svelte";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { renderInsideMain } from "../decorators/layout-decorators";
  import { brandingModes } from "../../../.storybook/modes";

  let { Story } = defineMeta({
    component: CloseButton,
    title: "Molecules/CloseButton",
    decorators: [renderInsideMain],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });
</script>

<Story name="Default" />
