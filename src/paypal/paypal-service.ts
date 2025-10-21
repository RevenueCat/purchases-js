import { loadCoreSdkScript, type SdkInstance } from "@paypal/paypal-js/sdk-v6";

export type PayPalSDKInstance = SdkInstance<readonly ["paypal-payments"]>;

export enum PayPalServiceErrorCode {
  ErrorLoadingPayPal = 0,
  PayPalPaymentFailed = 1,
}

export class PayPalServiceError {
  constructor(
    public code: PayPalServiceErrorCode,
    public gatewayErrorCode: string | undefined,
    public message: string | undefined,
  ) {}
}

export class PayPalService {
  static async initializePayPal(
    clientToken: string,
    isSandbox: boolean,
  ): Promise<PayPalSDKInstance> {
    try {
      const paypalSdk = await loadCoreSdkScript({
        environment: isSandbox ? "sandbox" : "production",
        debug: false,
      });

      const paypalSdkInstance = await paypalSdk.createInstance({
        clientToken,
        components: ["paypal-payments"],
        pageType: "checkout",
      });

      return paypalSdkInstance as PayPalSDKInstance;
    } catch (error) {
      throw new PayPalServiceError(
        PayPalServiceErrorCode.ErrorLoadingPayPal,
        undefined,
        error instanceof Error ? error.message : "Failed to load PayPal SDK",
      );
    }
  }

  static async allowsPayPalPaymentMethod(
    sdkInstance: PayPalSDKInstance,
    currencyCode: string,
  ): Promise<boolean> {
    try {
      const paymentMethods = await sdkInstance.findEligibleMethods({
        currencyCode,
      });

      return paymentMethods.isEligible("paypal");
    } catch (error) {
      throw new PayPalServiceError(
        PayPalServiceErrorCode.ErrorLoadingPayPal,
        undefined,
        error instanceof Error
          ? error.message
          : "Failed to check PayPal eligibility",
      );
    }
  }
}
