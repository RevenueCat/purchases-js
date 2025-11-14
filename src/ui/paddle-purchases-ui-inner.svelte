<script lang="ts">
  import Loading from "./molecules/loading.svelte";
  import SuccessPage from "./pages/success-page.svelte";
  import ErrorPage from "./pages/error-page.svelte";
  import Template from "./layout/template.svelte";
  import BrandingHeader from "./molecules/branding-header.svelte";
  import { type PriceBreakdown } from "./ui-types";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import type { Product, PurchaseOption } from "../main";
  import { getInitialPriceFromPurchaseOption } from "../helpers/purchase-option-price-helper";
  import ProductInfo from "./organisms/product-info.svelte";
  import { PurchaseFlowError } from "../helpers/purchase-operation-helper";

  interface Props {
    currentPage: "loading" | "success" | "error";
    brandingInfo: BrandingInfoResponse | null;
    productDetails: Product;
    purchaseOption: PurchaseOption;
    isSandbox: boolean;
    lastError: PurchaseFlowError | null;
    isInElement: boolean;
    defaultPriceBreakdown?: PriceBreakdown;
    onContinue: () => void;
    closeWithError: () => void;
    onClose?: () => void;
  }

  const {
    currentPage,
    brandingInfo,
    productDetails,
    purchaseOption,
    isSandbox,
    lastError,
    isInElement,
    defaultPriceBreakdown,
    onContinue,
    closeWithError,
    onClose = undefined,
  }: Props = $props();

  const initialPrice = getInitialPriceFromPurchaseOption(
    productDetails,
    purchaseOption,
  );

  let priceBreakdown: PriceBreakdown = $state(
    defaultPriceBreakdown ?? {
      currency: initialPrice.currency,
      totalAmountInMicros: initialPrice.amountMicros,
      totalExcludingTaxInMicros: initialPrice.amountMicros,
      taxCalculationStatus: "unavailable",
      taxAmountInMicros: null,
      taxBreakdown: null,
    },
  );
</script>

<Template {brandingInfo} {isInElement} {isSandbox} {onClose} isPaddle={true}>
  {#snippet navbarHeaderContent()}
    <BrandingHeader
      {brandingInfo}
      {onClose}
      showCloseButton={!isInElement && !!onClose}
    />
  {/snippet}
  {#snippet navbarBodyContent()}
    <ProductInfo
      {productDetails}
      {purchaseOption}
      showProductDescription={brandingInfo?.appearance
        ?.show_product_description ?? false}
      {priceBreakdown}
    />
  {/snippet}
  {#snippet mainContent()}
    {#if currentPage === "loading"}
      <Loading />
    {:else if currentPage === "success"}
      <SuccessPage {onContinue} />
    {:else if currentPage === "error"}
      <ErrorPage
        {lastError}
        {productDetails}
        supportEmail={brandingInfo?.support_email ?? null}
        onDismiss={closeWithError}
        appName={brandingInfo?.app_name ?? null}
      />
    {/if}
  {/snippet}
</Template>
