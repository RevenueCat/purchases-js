<script lang="ts">
  import PaymentEntryPage from "./pages/payment-entry-page.svelte";
  import ErrorPage from "./pages/error-page.svelte";
  import SuccessPage from "./pages/success-page.svelte";
  import LoadingPage from "./pages/payment-entry-loading-page.svelte";
  import {
    type PriceBreakdown,
    type ContinueHandlerParams,
    type CurrentPage,
    type TaxCustomerDetails,
  } from "./ui-types";
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
    priceBreakdown: PriceBreakdown;
    purchaseOperationHelper: PurchaseOperationHelper;
    isInElement: boolean;
    gatewayParams: GatewayParams;
    customerEmail: string | null;
    closeWithError: () => void;
    onContinue: (params?: ContinueHandlerParams) => void;
    onClose?: () => void;
    onTaxCustomerDetailsUpdated: (customerDetails: TaxCustomerDetails) => void;
  }

  const {
    currentPage,
    brandingInfo,
    productDetails,
    purchaseOptionToUse,
    isSandbox,
    lastError,
    priceBreakdown,
    purchaseOperationHelper,
    isInElement,
    gatewayParams,
    customerEmail,
    closeWithError,
    onContinue,
    onTaxCustomerDetailsUpdated,
    onClose = undefined,
  }: Props = $props();
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
        {priceBreakdown}
        {customerEmail}
        {onContinue}
        {onTaxCustomerDetailsUpdated}
      />
    {/if}

    {#if currentPage === "error"}
      <ErrorPage
        {lastError}
        {productDetails}
        supportEmail={brandingInfo?.support_email ?? null}
        onContinue={closeWithError}
      />
    {/if}
    {#if currentPage === "success"}
      <SuccessPage {productDetails} {onContinue} />
    {/if}
  {/snippet}
</Template>
