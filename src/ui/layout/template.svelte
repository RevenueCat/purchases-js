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
    isPaddle?: boolean;
  }

  const {
    brandingInfo,
    isInElement,
    isSandbox,
    mainContent,
    navbarHeaderContent,
    navbarBodyContent,
    isPaddle = false,
  }: Props = $props();
  const colorVariables = $derived(
    toProductInfoStyleVar(brandingInfo?.appearance, isPaddle) ?? "",
  );
</script>

<Container
  brandingAppearance={brandingInfo?.appearance}
  brandFontConfig={brandingInfo?.brand_font_config}
  {isInElement}
>
  {#if isSandbox}
    <SandboxBanner style={colorVariables} {isInElement} {brandingInfo} />
  {/if}
  <Layout style={colorVariables}>
    {#if navbarHeaderContent || navbarBodyContent}
      <NavBar
        brandingAppearance={brandingInfo?.appearance}
        headerContent={navbarHeaderContent}
        bodyContent={navbarBodyContent}
        {isPaddle}
      />
    {/if}
    <Main brandingAppearance={brandingInfo?.appearance}>
      {@render mainContent?.()}
    </Main>
  </Layout>
</Container>
