<script lang="ts">
  import Container from "./container.svelte";
  import Layout from "./layout.svelte";
  import NavBar from "./navbar.svelte";
  import SandboxBanner from "../molecules/sandbox-banner.svelte";
  import Main from "./main-block.svelte";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import { type Snippet } from "svelte";
  import { toProductInfoStyleVar } from "../theme/utils";

  export interface Props {
    brandingInfo: BrandingInfoResponse | null;
    isInElement: boolean;
    isSandbox: boolean;
    onClose: (() => void) | undefined;
    navbarHeaderContent?: Snippet<[]>;
    navbarBodyContent?: Snippet<[]>;
    mainContent?: Snippet<[]>;
  }

  const {
    brandingInfo,
    isInElement,
    isSandbox,
    mainContent,
    navbarHeaderContent,
    navbarBodyContent,
  }: Props = $props();
  const colorVariables = $derived(
    toProductInfoStyleVar(brandingInfo?.appearance) ?? "",
  );
</script>

<Container brandingAppearance={brandingInfo?.appearance} {isInElement}>
  {#if isSandbox}
    <SandboxBanner style={colorVariables} {isInElement} />
  {/if}
  <Layout style={colorVariables}>
    {#if navbarHeaderContent || navbarBodyContent}
      <NavBar
        brandingAppearance={brandingInfo?.appearance}
        headerContent={navbarHeaderContent}
        bodyContent={navbarBodyContent}
      />
    {/if}
    <Main brandingAppearance={brandingInfo?.appearance}>
      {@render mainContent?.()}
    </Main>
  </Layout>
</Container>
