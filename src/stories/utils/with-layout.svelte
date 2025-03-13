<script module>
  import { brandingInfos } from "../fixtures";
  import { toProductInfoStyleVar } from "../../ui/theme/utils";
  import Container from "../../ui/layout/container.svelte";
  import Layout from "../../ui/layout/layout.svelte";
  import Main from "../../ui/layout/main-block.svelte";
  import { type Snippet } from "svelte";
</script>

<script lang="ts">
  export interface Props {
    children: Snippet<[]>;
    globals: {
      brandingName: string;
    };
  }

  const { children, globals }: Props = $props();
  const brandingInfo = $derived(brandingInfos[globals.brandingName]);
  const colorVariables = $derived(
    toProductInfoStyleVar(brandingInfo.appearance),
  );
</script>

<Container brandingAppearance={brandingInfo.appearance}>
  <Layout style={colorVariables}>
    <Main brandingAppearance={brandingInfo.appearance}>
      {#snippet body()}
        {@render children()}
      {/snippet}
    </Main>
  </Layout>
</Container>
