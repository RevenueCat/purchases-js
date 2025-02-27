<script lang="ts">
  import { getContext, onMount } from "svelte";
  import Button from "../button.svelte";
  import type {
    Appearance,
    Stripe,
    StripeElementLocale,
    StripeElements,
    StripeError,
    StripePaymentElement,
    StripePaymentElementChangeEvent,
  } from "@stripe/stripe-js";
  import type { Product, PurchaseOption } from "../../entities/offerings";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import { Theme } from "../theme/theme";
  import IconError from "../icons/icon-error.svelte";
  import MessageLayout from "../layout/message-layout.svelte";

  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";
  import Localized from "../localization/localized.svelte";

  import { LocalizationKeys } from "../localization/supportedLanguages";
  import SecureCheckoutRc from "../secure-checkout-rc.svelte";
  import { type CheckoutStartResponse } from "../../networking/responses/checkout-start-response";
  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
    PurchaseOperationHelper,
  } from "../../helpers/purchase-operation-helper";
  import { DEFAULT_FONT_FAMILY } from "../theme/text";
  import { StripeService } from "../../stripe/stripe-service";
  import { type ContinueHandlerParams } from "../ui-types";
  import { type IEventsTracker } from "../../behavioural-events/events-tracker";
  import { eventsTrackerContextKey } from "../constants";
  import {
    createCheckoutPaymentFormSubmitEvent,
    createCheckoutPaymentGatewayErrorEvent,
  } from "../../behavioural-events/sdk-event-helpers";
  import { SDKEventName } from "../../behavioural-events/sdk-events";
  import StateLoading from "./state-loading.svelte";

  export let onContinue: (params?: ContinueHandlerParams) => void;
  export let paymentInfoCollectionMetadata: CheckoutStartResponse;
  export let processing = false;
  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;
  export let brandingInfo: BrandingInfoResponse | null;
  export let purchaseOperationHelper: PurchaseOperationHelper;

  let stripe: Stripe | null = null;
  let elements: StripeElements;
  let safeElements: StripeElements;
  let paymentElement: StripePaymentElement | null = null;
  let modalErrorMessage: string | undefined = undefined;
  let isPaymentInfoComplete = false;
  let clientSecret: string | undefined = undefined;
  let selectedPaymentMethod: string | undefined = undefined;
  let isStripeLoading = true;

  const eventsTracker = getContext(eventsTrackerContextKey) as IEventsTracker;

  let spacing = new Theme().spacing;

  let stripeVariables: undefined | Appearance["variables"];
  let viewport: "mobile" | "desktop" = "mobile";

  // Maybe extract this to a
  function updateStripeVariables() {
    const isMobile =
      window.matchMedia && window.matchMedia("(max-width: 767px)").matches;

    if (isMobile) {
      viewport = "mobile";
    } else {
      viewport = "desktop";
    }

    stripeVariables = {
      fontSizeBase: "14px",
      fontFamily: DEFAULT_FONT_FAMILY,
      spacingGridRow: spacing.gapXLarge[viewport],
    };
  }

  let resizeTimeout: number | undefined;

  function onResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateStripeVariables();
    }, 150);
  }

  const translator: Translator =
    getContext(translatorContextKey) || Translator.fallback();
  const stripeElementLocale = (translator.locale ||
    translator.fallbackLocale) as StripeElementLocale;

  /**
   * This function converts some particular locales to the ones that stripe supports.
   * Finally falls back to 'auto' if the initialLocale is not supported by stripe.
   * @param initialLocale
   */
  const getLocaleToUse = (
    initialLocale: StripeElementLocale,
  ): StripeElementLocale => {
    // These locale that we support are not supported by stripe.
    // if any of these is passed we fallback to 'auto' so that
    // stripe will pick up the locale from the browser.
    const stripeUnsupportedLocale = ["ca", "hi", "uk"];

    if (stripeUnsupportedLocale.includes(initialLocale)) {
      return "auto";
    }

    const mappedLocale: Record<string, StripeElementLocale> = {
      zh_Hans: "zh",
      zh_Hant: "zh",
    };

    if (Object.keys(mappedLocale).includes(initialLocale)) {
      return mappedLocale[initialLocale];
    }

    return initialLocale;
  };

  const localeToUse = getLocaleToUse(stripeElementLocale);

  $: {
    // @ts-ignore
    if (elements && elements._elements.length > 0) {
      safeElements = elements;
    }
  }

  onMount(() => {
    updateStripeVariables();

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  });

  onMount(() => {
    let isMounted = true;

    eventsTracker.trackSDKEvent({
      eventName: SDKEventName.CheckoutPaymentFormImpression,
    });

    (async () => {
      try {
        const { stripe: stripeInstance, elements: elementsInstance } =
          await StripeService.initializeStripe(
            paymentInfoCollectionMetadata,
            brandingInfo,
            localeToUse,
            stripeVariables,
            viewport,
          );

        if (!isMounted) return;

        stripe = stripeInstance;
        elements = elementsInstance;

        paymentElement = StripeService.createPaymentElement(
          elements,
          brandingInfo?.app_name,
        );

        paymentElement.mount("#payment-element");

        paymentElement.on("ready", () => {
          isStripeLoading = false;
        });

        paymentElement.on(
          "change",
          (event: StripePaymentElementChangeEvent) => {
            isPaymentInfoComplete = event.complete;
          },
        );
        paymentElement.on("loaderror", (event) => {
          isMounted = false;
          const purchaseError = new PurchaseFlowError(
            PurchaseFlowErrorCode.ErrorSettingUpPurchase,
            "Failed to load payment form",
            event.error instanceof Error
              ? event.error.message
              : String(event.error),
          );
          handlePaymentError(purchaseError);
        });
      } catch (error) {
        if (!isMounted) return;
        isStripeLoading = false;

        const purchaseError = new PurchaseFlowError(
          PurchaseFlowErrorCode.ErrorSettingUpPurchase,
          "Failed to initialize payment form",
          error instanceof Error ? error.message : String(error),
        );
        handlePaymentError(purchaseError);
      }
    })();

    return () => {
      if (isMounted) {
        isMounted = false;
        paymentElement?.destroy();
      }
    };
  });

  const handleContinue = async () => {
    if (processing || !stripe || !safeElements) return;

    const event = createCheckoutPaymentFormSubmitEvent({
      selectedPaymentMethod: selectedPaymentMethod ?? null,
    });
    eventsTracker.trackSDKEvent(event);

    processing = true;

    const { error: submitError } = await safeElements.submit();
    if (submitError) {
      handlePaymentError(submitError);
    } else {
      const checkoutError = await completeCheckout(stripe);

      if (checkoutError) {
        handlePaymentError(checkoutError);
      } else {
        onContinue();
      }
    }
  };

  function handlePaymentError(error: StripeError | PurchaseFlowError) {
    processing = false;

    const event = createCheckoutPaymentGatewayErrorEvent({
      errorCode:
        error instanceof PurchaseFlowError
          ? error.errorCode?.toString()
          : (error.code ?? null),
      errorMessage: error.message ?? "",
    });
    eventsTracker.trackSDKEvent(event);

    if (error instanceof PurchaseFlowError) {
      if (error.isRecoverable()) {
        modalErrorMessage = error.getPublicErrorMessage(productDetails);
      } else {
        onContinue({ error: error });
      }
    } else if (!StripeService.isStripeHandledCardError(error)) {
      modalErrorMessage = error.message;
    }
  }

  const completeCheckout = async (stripe: Stripe) => {
    // Get client secret if not already present
    if (!clientSecret) {
      try {
        const response = await purchaseOperationHelper.checkoutComplete();
        clientSecret = response?.gateway_params?.client_secret;
        if (!clientSecret) {
          throw new Error("Failed to complete checkout");
        }
      } catch (error) {
        return error as PurchaseFlowError;
      }
    }

    // Confirm payment or setup intent with Stripe
    const isSetupIntent = clientSecret.startsWith("seti_");
    const result = await stripe[
      isSetupIntent ? "confirmSetup" : "confirmPayment"
    ]({
      elements: safeElements,
      clientSecret,
      redirect: "if_required",
    });

    return result.error;
  };

  const handleErrorTryAgain = () => {
    modalErrorMessage = undefined;
  };
</script>

<div class="rc-checkout-container">
  {#if isStripeLoading || processing}
    <StateLoading />
  {/if}
  <!-- <TextSeparator text="Pay by card" /> -->
  <form
    on:submit|preventDefault={handleContinue}
    data-testid="payment-form"
    class="rc-checkout-form"
    class:hidden={isStripeLoading || processing}
  >
    <div class="rc-checkout-form-container" hidden={!!modalErrorMessage}>
      <div class="rc-payment-element-container">
        <div id="payment-element" class:hidden={isStripeLoading}></div>
      </div>

      <div class="rc-checkout-pay-container">
        {#if !modalErrorMessage}
          <Button
            disabled={processing || !isPaymentInfoComplete || isStripeLoading}
            testId="PayButton"
          >
            {#if productDetails.subscriptionOptions?.[purchaseOption.id]?.trial}
              <Localized
                key={LocalizationKeys.StateNeedsPaymentInfoButtonStartTrial}
              />
            {:else}
              <Localized
                key={LocalizationKeys.StateNeedsPaymentInfoButtonPay}
              />
            {/if}
          </Button>
        {/if}

        <div class="rc-checkout-secure-container">
          <SecureCheckoutRc />
        </div>
      </div>
    </div>

    {#if modalErrorMessage}
      <MessageLayout
        title={null}
        type="error"
        closeButtonTitle={translator.translate(
          LocalizationKeys.StateErrorButtonTryAgain,
        )}
        onContinue={handleErrorTryAgain}
      >
        {#snippet icon()}
          <IconError />
        {/snippet}
        {#snippet message()}
          {modalErrorMessage}
        {/snippet}
      </MessageLayout>
    {/if}
  </form>
</div>

<style>
  .rc-checkout-secure-container {
    margin-top: var(--rc-spacing-gapXLarge-mobile);
  }

  .rc-checkout-container {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapXLarge-mobile);
    user-select: none;
  }

  .rc-checkout-pay-container {
    display: flex;
    flex-direction: column;
    margin-top: var(--rc-spacing-gapXLarge-mobile);
  }

  .rc-checkout-form-container {
    width: 100%;
  }

  .rc-payment-element-container {
    /* The standard height of the payment form from Stripe */
    /* Added to avoid the card getting smaller while loading */
    min-height: 320px;
  }

  .hidden {
    visibility: hidden;
  }

  @container layout-query-container (width <= 767px) {
    .rc-checkout-pay-container {
      flex-grow: 1;
      justify-content: flex-end;
    }
    .rc-checkout-form {
      flex-grow: 1;
    }

    .rc-checkout-form-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .rc-checkout-container {
      flex-grow: 1;
    }
  }

  @container layout-query-container (width >= 768px) {
    .rc-checkout-secure-container {
      margin-top: var(--rc-spacing-gapXLarge-desktop);
    }

    .rc-checkout-container {
      gap: var(--rc-spacing-gapXLarge-desktop);
    }

    .rc-checkout-pay-container {
      margin-top: var(--rc-spacing-gapXLarge-desktop);
    }
  }
</style>
