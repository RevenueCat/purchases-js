<script module>
  import BackButton from "../../ui/molecules/back-button.svelte";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { renderInsideMain } from "../decorators/layout-decorators";
  import { brandingModes } from "../../../.storybook/modes";

  let { Story } = defineMeta({
    component: BackButton,
    title: "Molecules/BackButton",
    decorators: [renderInsideMain],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });
</script>

<Story name="Default" />
<Story name="Disabled" args={{ disabled: true }} />
