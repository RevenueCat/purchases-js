<script lang="ts">
  import Container from "./container.svelte";
  import Layout from "./layout.svelte";
  import NavBar from "./navbar.svelte";
  import SandboxBanner from "../molecules/sandbox-banner.svelte";
  import Main from "./main-block.svelte";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import BrandingInfoUI from "../molecules/branding-info.svelte";
  import { type Snippet } from "svelte";

  export interface Props {
    brandingInfo: BrandingInfoResponse | null;
    isInElement: boolean;
    colorVariables: string;
    isSandbox: boolean;
    onClose: (() => void) | undefined;
    navbarContent: Snippet<[]>;
    mainContent: Snippet<[]>;
  }

  const {
    brandingInfo,
    isInElement,
    colorVariables,
    isSandbox,
    onClose,
    navbarContent,
    mainContent,
  }: Props = $props();
</script>

<Container brandingAppearance={brandingInfo?.appearance} {isInElement}>
  {#if isSandbox}
    <SandboxBanner style={colorVariables} {isInElement} />
  {/if}
  <Layout style={colorVariables}>
    <NavBar
      brandingAppearance={brandingInfo?.appearance}
      {onClose}
      showCloseButton={!isInElement}
    >
      {#snippet headerContent()}
        <BrandingInfoUI {brandingInfo} />
      {/snippet}

      {#snippet bodyContent()}
        {@render navbarContent?.()}
      {/snippet}
    </NavBar>
    <Main brandingAppearance={brandingInfo?.appearance}>
      {#snippet body()}
        {@render mainContent?.()}
      {/snippet}
    </Main>
  </Layout>
</Container>
