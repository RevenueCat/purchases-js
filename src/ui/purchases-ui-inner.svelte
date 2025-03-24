<script lang="ts">
  import StateNeedsPaymentInfo from "./states/state-needs-payment-info.svelte";
  import StateNeedsAuthInfo from "./states/state-needs-auth-info.svelte";
  import StateLoading from "./states/state-loading.svelte";
  import StateError from "./states/state-error.svelte";
  import StateSuccess from "./states/state-success.svelte";
  import { type ContinueHandlerParams, type CurrentView } from "./ui-types";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import type { Product, PurchaseOption } from "../main";
  import ProductInfo from "./organisms/product-info.svelte";
  import {
    PurchaseFlowError,
    PurchaseOperationHelper,
  } from "../helpers/purchase-operation-helper";
  import { type CheckoutStartResponse } from "../networking/responses/checkout-start-response";
  import Template from "./layout/template.svelte";
  import { type CheckoutCalculateTaxResponse } from "../networking/responses/checkout-calculate-tax-response";

  export let currentView: CurrentView;
  export let brandingInfo: BrandingInfoResponse | null;
  export let productDetails: Product;
  export let purchaseOptionToUse: PurchaseOption;
  export let isSandbox: boolean = false;
  export let handleContinue: (params?: ContinueHandlerParams) => void;
  export let closeWithError: () => void;
  export let onClose: (() => void) | undefined = undefined;
  export let lastError: PurchaseFlowError | null;
  export let checkoutStartResponse: CheckoutStartResponse | null;
  export let initialTaxCalculation: CheckoutCalculateTaxResponse | null;
  export let purchaseOperationHelper: PurchaseOperationHelper;
  export let isInElement: boolean = false;
</script>

<Template {brandingInfo} {isInElement} {isSandbox} {onClose}>
  {#snippet navbarContent()}
    <ProductInfo
      {productDetails}
      purchaseOption={purchaseOptionToUse}
      showProductDescription={brandingInfo?.appearance
        ?.show_product_description ?? false}
    />
  {/snippet}
  {#snippet mainContent()}
    {#if currentView === "needs-auth-info" || currentView === "processing-auth-info"}
      <StateNeedsAuthInfo
        onContinue={handleContinue}
        processing={currentView === "processing-auth-info"}
        {lastError}
      />
    {/if}
    {#if checkoutStartResponse && (currentView === "needs-payment-info" || currentView === "polling-purchase-status")}
      <StateNeedsPaymentInfo
        {checkoutStartResponse}
        onContinue={handleContinue}
        processing={currentView === "polling-purchase-status"}
        {productDetails}
        purchaseOption={purchaseOptionToUse}
        {brandingInfo}
        {purchaseOperationHelper}
        taxCalculation={initialTaxCalculation}
      />
    {/if}
    {#if currentView === "loading-payment-page"}
      <StateLoading />
    {/if}
    {#if currentView === "error"}
      <StateError
        {lastError}
        {productDetails}
        supportEmail={brandingInfo?.support_email ?? null}
        onContinue={closeWithError}
      />
    {/if}
    {#if currentView === "success"}
      <StateSuccess {productDetails} onContinue={handleContinue} />
    {/if}
  {/snippet}
</Template>
