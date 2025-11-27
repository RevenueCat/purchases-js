import type { StoryContext, StoryFn } from "@storybook/svelte";
import StorybookLayout from "./storybook-layout.svelte";

type LayoutPosition = "main" | "navbar-header" | "navbar-body";

interface StoryLayoutRenderResult {
  Component: typeof StorybookLayout;
  props: {
    globals: StoryContext["globals"];
    position: LayoutPosition;
  };
}

export function renderInsideMain(
  _Story: StoryFn,
  context: StoryContext,
): StoryLayoutRenderResult {
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
): StoryLayoutRenderResult {
  return {
    Component: StorybookLayout,
    props: {
      globals: context.globals,
      position: "navbar-header",
    },
  };
}

export function renderInsideNavbarBody(
  _Story: StoryFn,
  context: StoryContext,
): StoryLayoutRenderResult {
  return {
    Component: StorybookLayout,
    props: {
      globals: context.globals,
      position: "navbar-body",
    },
  };
}
