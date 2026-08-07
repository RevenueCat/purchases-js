<script lang="ts">
  import { onMount, setContext } from "svelte";
  import { writable } from "svelte/store";
  import { Button } from "@revenuecat/purchases-ui-js";
  import type { BrandingInfoResponse } from "../networking/responses/branding-response";
  import type { SubscriptionChangeCheckoutStartResponse } from "../networking/responses/subscription-change-response";
  import {
    isWebBillingCheckoutStartResponse,
    type WebBillingCheckoutStartResponse,
  } from "../networking/responses/checkout-start-response";
  import type { ProductChangeResult } from "../entities/product-change-params";
  import {
    ProductChangeOperationHelper,
    type ProductChangeStartResult,
  } from "../helpers/product-change-operation-helper";
  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
  } from "../helpers/purchase-operation-helper";
  import Template from "./layout/template.svelte";
  import BrandingHeader from "./molecules/branding-header.svelte";
  import LoadingPage from "./pages/payment-entry-loading-page.svelte";
  import ErrorPage from "./pages/error-page.svelte";
  import Typography from "./atoms/typography.svelte";
  import ProductInfo from "./organisms/product-info.svelte";
  import UpgradeProductInfo from "./organisms/upgrade-product-info.svelte";
  import type { Package, PurchaseOption } from "../entities/offerings";
  import { getInitialPriceFromPurchaseOption } from "../helpers/purchase-option-price-helper";
  import type { PriceBreakdown } from "./ui-types";
  import { Translator } from "./localization/translator";
  import { translatorContextKey } from "./localization/constants";

  interface Props {
    subscriberToken: string;
    customerEmail?: string;
    rcPackage: Package;
    purchaseOption: PurchaseOption;
    brandingInfo: BrandingInfoResponse | null;
    isInElement: boolean;
    isSandbox: boolean;
    productChangeOperationHelper: ProductChangeOperationHelper;
    startCheckout: (
      customerEmail: string | undefined,
    ) => Promise<ProductChangeStartResult>;
    onFallthrough: (
      initialCheckoutStartResponse?: WebBillingCheckoutStartResponse,
    ) => void;
    initialStartData?: SubscriptionChangeCheckoutStartResponse | null;
    onFinished: (result: ProductChangeResult) => void;
    onError: (error: PurchaseFlowError) => void;
    onClose: (() => void) | undefined;
  }

  const {
    subscriberToken,
    customerEmail = undefined,
    rcPackage,
    purchaseOption,
    brandingInfo,
    isInElement,
    isSandbox,
    productChangeOperationHelper,
    startCheckout,
    onFallthrough,
    initialStartData = null,
    onFinished,
    onError,
    onClose,
  }: Props = $props();

  type UpgradeCheckoutPage = "loading" | "confirm" | "error";

  let currentPage = $state<UpgradeCheckoutPage>("loading");
  let confirming = $state(false);
  let startData = $state<SubscriptionChangeCheckoutStartResponse | null>(null);
  let lastError = $state<PurchaseFlowError | null>(null);
  let confirmError = $state<string | null>(null);

  const productDetails = rcPackage.webBillingProduct;
  const brandingAppearance = $derived(brandingInfo?.appearance ?? undefined);

  const initialPrice = getInitialPriceFromPurchaseOption(
    productDetails,
    purchaseOption,
  );
  const initialPriceBreakdown: PriceBreakdown = {
    currency: initialPrice.currency,
    totalAmountInMicros: initialPrice.amountMicros,
    totalExcludingTaxInMicros: initialPrice.amountMicros,
    taxCalculationStatus: "unavailable",
    taxAmountInMicros: null,
    taxBreakdown: null,
  };

  const translatorStore = writable(new Translator());
  setContext(translatorContextKey, translatorStore);

  onMount(() => {
    if (initialStartData) {
      productChangeOperationHelper.setStartResponse(initialStartData);
      startData = initialStartData;
      currentPage = "confirm";
      return;
    }

    void startSession();
  });

  async function startSession() {
    try {
      let result: ProductChangeStartResult;
      try {
        result = await startCheckout(customerEmail);
      } catch (e) {
        if (
          e instanceof PurchaseFlowError &&
          e.errorCode === PurchaseFlowErrorCode.MissingEmailError
        ) {
          result = await startCheckout(undefined);
        } else {
          throw e;
        }
      }

      if (result.mode === "subscription_change") {
        startData = result.response;
        currentPage = "confirm";
        return;
      }

      onFallthrough(
        isWebBillingCheckoutStartResponse(result.response)
          ? result.response
          : undefined,
      );
    } catch (e) {
      lastError =
        e instanceof PurchaseFlowError
          ? e
          : new PurchaseFlowError(
              PurchaseFlowErrorCode.ErrorSettingUpPurchase,
              "Failed to load upgrade checkout.",
              e instanceof Error ? e.message : String(e),
            );
      currentPage = "error";
    }
  }

  const closeWithError = () => {
    onError(
      lastError ??
        new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "Unknown error without state set.",
        ),
    );
  };

  async function handleConfirm() {
    if (!startData || confirming) {
      return;
    }
    confirming = true;
    confirmError = null;
    try {
      const result =
        await productChangeOperationHelper.confirm(subscriberToken);
      onFinished(result);
    } catch (e) {
      const error =
        e instanceof PurchaseFlowError
          ? e
          : new PurchaseFlowError(
              PurchaseFlowErrorCode.ErrorChargingPayment,
              "Failed to confirm product change.",
              e instanceof Error ? e.message : String(e),
            );
      confirmError = error.message;
    } finally {
      confirming = false;
    }
  }

  const ctaLabel = $derived(
    startData?.change_type === "deferred" ? "Confirm schedule" : "Pay now",
  );

  const paymentMethodLabel = $derived.by(() => {
    const paymentMethod = startData?.payment_method;
    if (!paymentMethod) {
      return null;
    }
    const brandOrType = paymentMethod.brand ?? paymentMethod.type;
    return paymentMethod.last_4
      ? `${brandOrType} •••• ${paymentMethod.last_4}`
      : brandOrType;
  });

  const billingAddressLabel = $derived.by(() => {
    const address = startData?.billing_address;
    if (!address) {
      return null;
    }
    return (
      [address.postal_code, address.country_code].filter(Boolean).join(", ") ||
      "On file"
    );
  });
</script>

<Template {brandingInfo} {isInElement} {isSandbox} {onClose}>
  {#snippet navbarHeaderContent()}
    <BrandingHeader {brandingInfo} showCloseButton={!isInElement} {onClose} />
  {/snippet}

  {#snippet navbarBodyContent()}
    {#if startData}
      <UpgradeProductInfo {startData} />
    {:else}
      <ProductInfo
        {productDetails}
        {purchaseOption}
        showProductDescription={brandingInfo?.appearance
          ?.show_product_description ?? false}
        priceBreakdown={initialPriceBreakdown}
      />
    {/if}
  {/snippet}

  {#snippet mainContent()}
    {#if currentPage === "loading"}
      <LoadingPage />
    {:else if currentPage === "error"}
      <ErrorPage
        {lastError}
        {productDetails}
        supportEmail={brandingInfo?.support_email ?? null}
        onDismiss={closeWithError}
        appName={brandingInfo?.app_name ?? null}
      />
    {:else if startData}
      <div class="rcb-upgrade-checkout">
        <div class="rcb-upgrade-details">
          <div class="rcb-upgrade-section">
            <div class="rcb-upgrade-section-label">
              <Typography size="body-small">Email</Typography>
            </div>
            <Typography size="body-base">{startData.email}</Typography>
          </div>

          {#if paymentMethodLabel}
            <div class="rcb-upgrade-section">
              <div class="rcb-upgrade-section-label">
                <Typography size="body-small">Payment method</Typography>
              </div>
              <Typography size="body-base">{paymentMethodLabel}</Typography>
            </div>
          {/if}

          {#if billingAddressLabel}
            <div class="rcb-upgrade-section">
              <div class="rcb-upgrade-section-label">
                <Typography size="body-small">Billing address</Typography>
              </div>
              <Typography size="body-base">{billingAddressLabel}</Typography>
            </div>
          {/if}

          {#if startData.change_type === "deferred"}
            <div class="rcb-upgrade-section rcb-upgrade-section-label">
              <Typography size="body-small">
                This change will take effect at the end of your current billing
                period. You will not be charged now.
              </Typography>
            </div>
          {/if}
        </div>

        {#if confirmError}
          <Typography size="body-base">{confirmError}</Typography>
        {/if}

        <div class="rcb-upgrade-actions">
          <Button
            disabled={confirming}
            onclick={handleConfirm}
            {brandingAppearance}
          >
            {confirming ? "Confirming…" : ctaLabel}
          </Button>
        </div>
      </div>
    {/if}
  {/snippet}
</Template>

<style>
  .rcb-upgrade-checkout {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapXXLarge-mobile);
    user-select: none;
  }

  .rcb-upgrade-details {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapXLarge-mobile);
  }

  .rcb-upgrade-section {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapSmall-mobile);
  }

  .rcb-upgrade-section-label {
    color: var(--rc-color-grey-text-light);
  }

  .rcb-upgrade-actions {
    display: flex;
    flex-direction: column;
  }

  @container layout-query-container (width >= 768px) {
    .rcb-upgrade-checkout {
      gap: var(--rc-spacing-gapXXLarge-desktop);
    }

    .rcb-upgrade-details {
      gap: var(--rc-spacing-gapXLarge-desktop);
    }
  }
</style>
