<script module lang="ts">
  import InfoMessage from "../../ui/molecules/info-message.svelte";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { renderInsideMain } from "../decorators/layout-decorators";
  import { brandingModes } from "../../../.storybook/modes";

  let { Story } = defineMeta({
    component: InfoMessage,
    title: "Molecules/InfoMessage",
    // @ts-expect-error ignore typing of decorator
    decorators: [renderInsideMain],
    parameters: {
      chromatic: {
        modes: brandingModes,
      },
    },
  });
</script>

<Story name="Default">
  <InfoMessage
    title="Important Information"
    message="This is an example of a custom info message that can be used throughout the application."
  />
</Story>
