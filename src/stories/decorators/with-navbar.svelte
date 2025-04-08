<script module>
  import { brandingInfos } from "../fixtures";
  import { toProductInfoStyleVar } from "../../ui/theme/utils";
  import Container from "../../ui/layout/container.svelte";
  import Layout from "../../ui/layout/layout.svelte";
  import Main from "../../ui/layout/main-block.svelte";
  import NavBar from "../../ui/layout/navbar.svelte";
  import { type Snippet } from "svelte";
</script>

<script lang="ts">
  export interface Props {
    children?: Snippet<[]>;
    globals: {
      brandingName: string;
      viewport: string;
    };
  }

  const { children, globals }: Props = $props();
  const brandingInfo = $derived(brandingInfos[globals.brandingName]);
  const colorVariables = $derived(
    toProductInfoStyleVar(brandingInfo.appearance),
  );
  const isInElement = $derived(globals.viewport === "embedded");
</script>

<Container brandingAppearance={brandingInfo.appearance} {isInElement}>
  <Layout style={colorVariables}>
    <NavBar
      brandingAppearance={brandingInfo.appearance}
      showCloseButton={false}
    >
      {#snippet headerContent()}{/snippet}
      {#snippet bodyContent()}
        {@render children?.()}
      {/snippet}
    </NavBar>
    <Main brandingAppearance={brandingInfo.appearance}>
      {#snippet body()}{/snippet}
    </Main>
  </Layout>
</Container>
