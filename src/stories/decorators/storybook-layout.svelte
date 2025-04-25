<script module>
  import { brandingInfos } from "../fixtures";
  import type { Snippet } from "svelte";
  import Template from "../../ui/layout/template.svelte";

  type LayoutPosition = "main" | "navbar-header" | "navbar-body";

  export interface Props {
    children?: Snippet<[]>;
    position: LayoutPosition;
    globals: {
      brandingName: string;
      viewport: string;
    };
  }
</script>

<script lang="ts">
  const { children, position, globals }: Props = $props();

  const brandingInfo = $derived(brandingInfos[globals.brandingName]);
  const isInElement = $derived(globals.viewport === "embedded");
  const mainContent = $derived(position === "main" ? children : undefined);

  const navbarHeaderContent = $derived(
    position === "navbar-header" ? children : undefined,
  );

  const navbarBodyContent = $derived(
    position === "navbar-body" ? children : undefined,
  );
</script>

<Template
  {brandingInfo}
  {isInElement}
  isSandbox={false}
  onClose={() => {}}
  {mainContent}
  {navbarHeaderContent}
  {navbarBodyContent}
/>
