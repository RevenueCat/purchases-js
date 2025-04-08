<script lang="ts">
  import PaymentEntryPage from "./pages/payment-entry-page.svelte";
  import EmailEntryPage from "./pages/email-entry-page.svelte";
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

  export let currentPage: CurrentPage;
  export let brandingInfo: BrandingInfoResponse | null;
  export let productDetails: Product;
  export let purchaseOptionToUse: PurchaseOption;
  export let isSandbox: boolean = false;
  export let handleContinue: (params?: ContinueHandlerParams) => void;
  export let closeWithError: () => void;
  export let onClose: (() => void) | undefined = undefined;
  export let lastError: PurchaseFlowError | null;
  export let priceBreakdown: PriceBreakdown;
  export let purchaseOperationHelper: PurchaseOperationHelper;
  export let isInElement: boolean = false;
  export let gatewayParams: GatewayParams;
  export let onTaxCustomerDetailsUpdated: (
    customerDetails: TaxCustomerDetails,
  ) => void;
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
    {#if currentPage === "email-entry" || currentPage === "email-entry-processing"}
      <EmailEntryPage
        onContinue={handleContinue}
        processing={currentPage === "email-entry-processing"}
        {lastError}
      />
    {/if}
    {#if currentPage === "payment-entry-loading"}
      <LoadingPage />
    {/if}
    {#if currentPage === "payment-entry" || currentPage === "payment-entry-processing"}
      <PaymentEntryPage
        onContinue={handleContinue}
        processing={currentPage === "payment-entry-processing"}
        {productDetails}
        purchaseOption={purchaseOptionToUse}
        {brandingInfo}
        {purchaseOperationHelper}
        {gatewayParams}
        {priceBreakdown}
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
      <SuccessPage {productDetails} onContinue={handleContinue} />
    {/if}
  {/snippet}
</Template>
