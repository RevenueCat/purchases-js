import WithNavbar from "./with-navbar.svelte";

export function withNavbar(Story: unknown, context: unknown) {
  return {
    Component: WithNavbar,
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
