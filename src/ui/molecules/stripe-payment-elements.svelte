<script lang="ts">
  import { getContext, onMount } from "svelte";
  import type {
    Appearance,
    Stripe,
    StripeElementLocale,
    StripeElements,
    StripePaymentElement,
    StripePaymentElementChangeEvent,
  } from "@stripe/stripe-js";
  import { type BrandingInfoResponse } from "../../networking/responses/branding-response";
  import { Theme } from "../theme/theme";

  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";

  import { type GatewayParams } from "../../networking/responses/checkout-start-response";
  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
  } from "../../helpers/purchase-operation-helper";
  import { DEFAULT_FONT_FAMILY } from "../theme/text";
  import { StripeService } from "../../stripe/stripe-service";
  import { type Writable } from "svelte/store";

  export let gatewayParams: GatewayParams;
  export let brandingInfo: BrandingInfoResponse | null;
  export let onStripeReady: () => void;
  export let onStripeLoadingError: (error: PurchaseFlowError) => void;
  export let onPaymentInfoChange: (params: {
    complete: boolean;
    paymentMethod: string | undefined;
  }) => void;

  // Add export keyword to bind these variables to parent component
  export let stripe: Stripe | null = null;
  export let elements: StripeElements | undefined = undefined;
  export let stripeLocale: StripeElementLocale | undefined = undefined;

  let unsafeElements: StripeElements;

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

  const translator = getContext<Writable<Translator>>(translatorContextKey);

  $: initialLocale = ($translator.locale ||
    $translator.fallbackLocale) as string;

  $: stripeLocale = getLocaleToUse(initialLocale);

  $: {
    // @ts-ignore
    if (unsafeElements && unsafeElements._elements.length > 0) {
      elements = unsafeElements;
    }
  }

  /**
   * This function converts some particular locales to the ones that stripe supports.
   * Finally falls back to 'auto' if the initialLocale is not supported by stripe.
   * @param initialLocale
   */
  const getLocaleToUse = (initialLocale: string): StripeElementLocale => {
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

    return initialLocale as StripeElementLocale;
  };

  onMount(() => {
    updateStripeVariables();

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  });

  onMount(() => {
    let paymentElement: StripePaymentElement | null = null;
    let isMounted = true;

    (async () => {
      try {
        const { stripe: stripeInstance, elements: elementsInstance } =
          await StripeService.initializeStripe(
            gatewayParams,
            brandingInfo,
            stripeLocale,
            stripeVariables,
            viewport,
          );

        if (!isMounted) return;

        stripe = stripeInstance;
        unsafeElements = elementsInstance;

        paymentElement = StripeService.createPaymentElement(
          unsafeElements,
          brandingInfo?.app_name,
        );

        paymentElement.mount("#payment-element");

        paymentElement.on("ready", () => {
          onStripeReady();
        });

        paymentElement.on(
          "change",
          (event: StripePaymentElementChangeEvent) => {
            onPaymentInfoChange({
              complete: event.complete,
              paymentMethod: event.complete ? event.value.type : undefined,
            });
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
          onStripeLoadingError(purchaseError);
        });
      } catch (error) {
        if (!isMounted) return;

        const purchaseError = new PurchaseFlowError(
          PurchaseFlowErrorCode.ErrorSettingUpPurchase,
          "Failed to initialize payment form",
          error instanceof Error ? error.message : String(error),
        );

        onStripeLoadingError(purchaseError);
      }
    })();

    return () => {
      if (isMounted) {
        isMounted = false;
        paymentElement?.destroy();
      }
    };
  });
</script>

<div id="payment-element"></div>
