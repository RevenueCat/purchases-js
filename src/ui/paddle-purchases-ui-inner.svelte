<script lang="ts">
  import SuccessPage from "./pages/success-page.svelte";
  import ErrorPage from "./pages/error-page.svelte";
  import FullscreenTemplate from "./layout/fullscreen-template.svelte";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import type { Product } from "../main";
  import { PurchaseFlowError } from "../helpers/purchase-operation-helper";
  import Typography from "./atoms/typography.svelte";
  import Spinner from "./atoms/spinner.svelte";
  import { LocalizationKeys } from "./localization/supportedLanguages";
  import { getContext } from "svelte";
  import { translatorContextKey } from "./localization/constants";
  import { Translator } from "./localization/translator";
  import { type Writable } from "svelte/store";
  import ColLayout from "./layout/col-layout.svelte";

  interface Props {
    currentPage: "loading" | "success" | "error";
    brandingInfo: BrandingInfoResponse | null;
    productDetails: Product;
    isSandbox: boolean;
    lastError: PurchaseFlowError | null;
    isInElement: boolean;
    onContinue: () => void;
    closeWithError: () => void;
  }

  const {
    currentPage,
    brandingInfo,
    productDetails,
    isSandbox,
    lastError,
    isInElement,
    onContinue,
    closeWithError,
  }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);
</script>

<FullscreenTemplate {brandingInfo} {isInElement} {isSandbox}>
  {#snippet mainContent()}
    {#if currentPage === "loading"}
      <div class="rcb-ui-loading-container">
        <ColLayout gap="medium" align="center">
          <Spinner color="var(--rc-color-grey-text-dark)" />
          <Typography size="heading-md"
            >{$translator.translate(
              LocalizationKeys.LoadingPageProcessingPayment,
            )}</Typography
          >

          <Typography size="body-small"
            >{$translator.translate(
              LocalizationKeys.LoadingPageKeepPageOpen,
            )}</Typography
          ></ColLayout
        >
      </div>
    {:else if currentPage === "success"}
      <SuccessPage {onContinue} fullWidth={true} />
    {:else if currentPage === "error"}
      <ErrorPage
        {lastError}
        {productDetails}
        supportEmail={brandingInfo?.support_email ?? null}
        onDismiss={closeWithError}
        appName={brandingInfo?.app_name ?? null}
        fullWidth={true}
      />
    {/if}
  {/snippet}
</FullscreenTemplate>

<style>
  .rcb-ui-loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
