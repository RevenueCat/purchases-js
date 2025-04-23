<script lang="ts">
  import PaymentEntryPage from "./pages/payment-entry-page.svelte";
  import ErrorPage from "./pages/error-page.svelte";
  import SuccessPage from "./pages/success-page.svelte";
  import LoadingPage from "./pages/payment-entry-loading-page.svelte";
  import { type PriceBreakdown, type CurrentPage } from "./ui-types";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import type { Product, PurchaseOption } from "../main";
  import ProductInfo from "./organisms/product-info.svelte";
  import {
    PurchaseFlowError,
    PurchaseOperationHelper,
  } from "../helpers/purchase-operation-helper";
  import Template from "./layout/template.svelte";
  import { type GatewayParams } from "../networking/responses/stripe-elements";

  interface Props {
    currentPage: CurrentPage;
    brandingInfo: BrandingInfoResponse | null;
    productDetails: Product;
    purchaseOptionToUse: PurchaseOption;
    isSandbox: boolean;
    lastError: PurchaseFlowError | null;
    purchaseOperationHelper: PurchaseOperationHelper;
    isInElement: boolean;
    gatewayParams: GatewayParams;
    customerEmail: string | null;
    defaultPriceBreakdown?: PriceBreakdown;
    closeWithError: () => void;
    onContinue: () => void;
    onError: (error: PurchaseFlowError) => void;
    onClose?: () => void;
  }

  const {
    currentPage,
    brandingInfo,
    productDetails,
    purchaseOptionToUse,
    isSandbox,
    lastError,
    purchaseOperationHelper,
    isInElement,
    gatewayParams,
    customerEmail,
    defaultPriceBreakdown,
    closeWithError,
    onContinue,
    onError,
    onClose = undefined,
  }: Props = $props();

  let priceBreakdown: PriceBreakdown = $state(
    defaultPriceBreakdown ?? {
      currency: productDetails.currentPrice.currency,
      totalAmountInMicros: productDetails.currentPrice.amountMicros,
      totalExcludingTaxInMicros: productDetails.currentPrice.amountMicros,
      taxCalculationStatus: "disabled",
      pendingReason: null,
      taxAmountInMicros: null,
      taxBreakdown: null,
    },
  );

  const onPriceBreakdownUpdated = (value: PriceBreakdown) => {
    priceBreakdown = value;
  };
</script>

<Template {brandingInfo} {isInElement} {isSandbox} {onClose}>
  {#snippet navbarContent()}
    <ProductInfo
      {productDetails}
      purchaseOption={purchaseOptionToUse}
      showProductDescription={brandingInfo?.appearance
        ?.show_product_description ?? false}
      {priceBreakdown}
    />
  {/snippet}
  {#snippet mainContent()}
    {#if currentPage === "payment-entry-loading"}
      <LoadingPage />
    {/if}
    {#if currentPage === "payment-entry" || currentPage === "payment-entry-processing"}
      <PaymentEntryPage
        processing={currentPage === "payment-entry-processing"}
        {productDetails}
        purchaseOption={purchaseOptionToUse}
        {brandingInfo}
        {purchaseOperationHelper}
        {gatewayParams}
        {customerEmail}
        {onContinue}
        {onError}
        {onPriceBreakdownUpdated}
      />
    {/if}

    {#if currentPage === "error"}
      <ErrorPage
        {lastError}
        {productDetails}
        supportEmail={brandingInfo?.support_email ?? null}
        onDismiss={closeWithError}
      />
    {/if}
    {#if currentPage === "success"}
      <SuccessPage {productDetails} {onContinue} />
    {/if}
  {/snippet}
</Template>
