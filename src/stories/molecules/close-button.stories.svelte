<script module>
  import CloseButton from "../../ui/molecules/close-button.svelte";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { withLayout } from "../decorators/with-layout";
  import { brandingModes } from "../../../.storybook/modes";

  let { Story } = defineMeta({
    component: CloseButton,
    title: "Molecules/CloseButton",
    // @ts-expect-error ignore typing of decorator
    decorators: [withLayout],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });
</script>

<Story name="Default" />
