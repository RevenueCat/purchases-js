import type { StoryContext, StoryFn } from "@storybook/svelte";
import StorybookLayout from "./storybook-layout.svelte";

export function renderInsideMain(_Story: StoryFn, context: StoryContext) {
  return {
    Component: StorybookLayout,
    props: {
      globals: context.globals,
      position: "main",
    },
  };
}

export function renderInsideNavbarHeader(
  _Story: StoryFn,
  context: StoryContext,
) {
  return {
    Component: StorybookLayout,
    props: {
      globals: context.globals,
      position: "navbar-header",
    },
  };
}

export function renderInsideNavbarBody(_Story: StoryFn, context: StoryContext) {
  return {
    Component: StorybookLayout,
    props: {
      globals: context.globals,
      position: "navbar-body",
    },
  };
}
