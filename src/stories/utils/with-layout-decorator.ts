import WithLayout from "./with-layout.svelte";

export default function withLayoutDecorator(Story: unknown, context: unknown) {
  return {
    Component: WithLayout,
    props: {
      // @ts-expect-error too hard to get the type right
      globals: context.globals,
      children: () => ({
        Component: Story,
        // @ts-expect-error too hard to get the type right
        props: context.args,
      }),
    },
  };
}
