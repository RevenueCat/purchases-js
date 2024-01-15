import {
  Offering as InnerOffering,
  Offerings as InnerOfferings,
  Package as InnerPackage,
  toOffering,
} from "./entities/offerings";
import {
  SubscribeResponse,
  toSubscribeResponse,
} from "./entities/subscribe-response";
import { PaymentProviderSettings, ServerResponse } from "./entities/types";
import RCPurchasesUI from "./ui/rcb-ui.svelte";

import { StatusCodes } from "http-status-codes";
import {
  AlreadySubscribedError,
  ConcurrentSubscriberAttributeUpdateError,
  InvalidInputDataError,
  PaymentGatewayError,
  UnknownServerError,
} from "./entities/errors";

export type Offerings = InnerOfferings;
export type Offering = InnerOffering;
export type Package = InnerPackage;

const VERSION = "0.0.8";

export class Purchases {
  // @internal
  _API_KEY: string | null = null;
  // @internal
  _APP_USER_ID: string | null = null;
  // @internal
  _PAYMENT_PROVIDER_SETTINGS: PaymentProviderSettings | null = null;

  private static readonly _RC_ENDPOINT = import.meta.env
    .VITE_RC_ENDPOINT as string;
  private static readonly _BASE_PATH = "rcbilling/v1";

  constructor(
    apiKey: string,
    paymentProviderSettings: PaymentProviderSettings,
  ) {
    this._API_KEY = apiKey;
    this._PAYMENT_PROVIDER_SETTINGS = paymentProviderSettings;

    if (Purchases._RC_ENDPOINT === undefined) {
      console.error(
        "Project was build without some of the environment variables set",
      );
    }

    // Will need to change this to something more flexible
    // if/when we end up supporting more payment gateways
    if (
      !this._PAYMENT_PROVIDER_SETTINGS.stripe ||
      !this._PAYMENT_PROVIDER_SETTINGS.stripe?.accountId ||
      !this._PAYMENT_PROVIDER_SETTINGS.stripe?.publishableKey
    ) {
      console.error(
        "Project was build without the stripe payment provider settings set",
      );
    }
  }

  private toOfferings = (
    offeringsData: ServerResponse,
    productsData: ServerResponse,
  ): Offerings => {
    const currentOfferingServerResponse =
      offeringsData.offerings.find(
        (o: ServerResponse) =>
          o.identifier === offeringsData.current_offering_id,
      ) ?? null;

    const productsMap: ServerResponse = {};
    productsData.product_details.forEach((p: ServerResponse) => {
      productsMap[p.identifier] = p;
    });

    const currentOffering: InnerOffering | null =
      currentOfferingServerResponse == null
        ? null
        : toOffering(currentOfferingServerResponse, productsMap);

    const allOfferings: { [offeringId: string]: Offering } = {};
    offeringsData.offerings.forEach((o: ServerResponse) => {
      const offering = toOffering(o, productsMap);
      if (offering != null) {
        allOfferings[o.identifier] = offering;
      }
    });

    if (Object.keys(allOfferings).length == 0) {
      console.log(
        "Empty offerings. Please make sure you've configured offerings correctly in the " +
          "RevenueCat dashboard and that the products are properly configured.",
      );
    }

    return {
      all: allOfferings,
      current: currentOffering,
    };
  };

  public async getOfferings(appUserId: string): Promise<Offerings> {
    const offeringsResponse = await fetch(
      `${Purchases._RC_ENDPOINT}/v1/subscribers/${appUserId}/offerings`,
      {
        headers: {
          Authorization: `Bearer ${this._API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Platform": "web",
          "X-Version": VERSION,
        },
      },
    );
    const offeringsData = await offeringsResponse.json();
    const productIds = offeringsData.offerings
      .flatMap((o: ServerResponse) => o.packages)
      .map((p: ServerResponse) => p.platform_product_identifier);

    const productsResponse = await fetch(
      `${Purchases._RC_ENDPOINT}/${
        Purchases._BASE_PATH
      }/subscribers/${appUserId}/products?id=${productIds.join("&id=")}`,
      {
        headers: {
          Authorization: `Bearer ${this._API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Platform": "web",
          "X-Version": VERSION,
        },
      },
    );

    const productsData = await productsResponse.json();
    this.logMissingProductIds(productIds, productsData.product_details);
    return this.toOfferings(offeringsData, productsData);
  }

  public async isEntitledTo(
    appUserId: string,
    entitlementIdentifier: string,
  ): Promise<boolean> {
    const response = await fetch(
      `${Purchases._RC_ENDPOINT}/${Purchases._BASE_PATH}/entitlements/${appUserId}`,
      {
        headers: {
          Authorization: `Bearer ${this._API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    const status = response.status;
    if (status === 404) {
      return false;
    }

    const data = await response.json();
    const entitlements = data.entitlements.map(
      (ent: ServerResponse) => ent.lookup_key,
    );
    return entitlements.includes(entitlementIdentifier);
  }

  public waitForEntitlement(
    appUserId: string,
    entitlementIdentifier: string,
    maxAttempts: number = 10,
  ): Promise<boolean> {
    const waitMSBetweenAttempts = 1000;
    return new Promise<boolean>((resolve, reject) => {
      const checkForEntitlement = (checkCount = 1) =>
        this.isEntitledTo(appUserId, entitlementIdentifier)
          .then((hasEntitlement) => {
            if (checkCount > maxAttempts) {
              return resolve(false);
            }

            if (hasEntitlement) {
              return resolve(true);
            } else {
              setTimeout(
                () => checkForEntitlement(checkCount + 1),
                waitMSBetweenAttempts,
              );
            }
          })
          .catch(reject);

      checkForEntitlement();
    });
  }

  public async subscribe(
    appUserId: string,
    productId: string,
    email: string,
    environment: "sandbox" | "production" = "production",
  ): Promise<SubscribeResponse> {
    const isSandbox = environment === "sandbox";
    const response = await fetch(
      `${Purchases._RC_ENDPOINT}/${Purchases._BASE_PATH}/subscribe`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this._API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          app_user_id: appUserId,
          product_id: productId,
          is_sandbox: isSandbox,
          email,
        }),
      },
    );

    if (response.status === StatusCodes.BAD_REQUEST) {
      throw new InvalidInputDataError(response.status);
    }

    if (response.status === StatusCodes.TOO_MANY_REQUESTS) {
      throw new ConcurrentSubscriberAttributeUpdateError(response.status);
    }

    if (response.status === StatusCodes.CONFLICT) {
      throw new AlreadySubscribedError(response.status);
    }

    if (response.status === StatusCodes.INTERNAL_SERVER_ERROR) {
      throw new PaymentGatewayError(response.status);
    }

    if (
      response.status === StatusCodes.OK ||
      response.status === StatusCodes.CREATED
    ) {
      const data = await response.json();
      return toSubscribeResponse(data);
    }

    throw new UnknownServerError();
  }

  public purchasePackage(
    appUserId: string,
    rcPackage: Package,
    {
      environment,
      customerEmail,
      htmlTarget,
    }: {
      environment?: "sandbox" | "production";
      customerEmail?: string;
      htmlTarget?: HTMLElement;
    } = { environment: "production" },
  ): Promise<void> {
    let resolvedHTMLTarget =
      htmlTarget ?? document.getElementById("rcb-ui-root");

    if (resolvedHTMLTarget === null) {
      const element = document.createElement("div");
      element.className = "rcb-ui-root";
      document.body.appendChild(element);
      resolvedHTMLTarget = element;
    }

    if (resolvedHTMLTarget === null) {
      throw new Error(
        "Could not generate a mount point for the billing widget",
      );
    }

    const certainHTMLTarget = resolvedHTMLTarget as unknown as HTMLElement;

    const asModal = !Boolean(htmlTarget);

    return new Promise((resolve) => {
      new RCPurchasesUI({
        target: certainHTMLTarget,
        props: {
          appUserId,
          rcPackage,
          environment,
          customerEmail,
          onFinished: () => {
            resolve();
            certainHTMLTarget.innerHTML = "";
          },
          purchases: this,
          asModal,
        },
      });
    });
  }

  private logMissingProductIds(
    productIds: string[],
    productDetails: ServerResponse[],
  ) {
    const foundProductIdsMap: { [productId: string]: ServerResponse } = {};
    productDetails.forEach(
      (ent: ServerResponse) => (foundProductIdsMap[ent.identifier] = ent),
    );
    const missingProductIds: string[] = [];
    productIds.forEach((productId: string) => {
      if (foundProductIdsMap[productId] === undefined) {
        missingProductIds.push(productId);
      }
    });
    if (missingProductIds.length > 0) {
      console.log(
        "Could not find product data for product ids: ",
        missingProductIds,
        ". Please check that your product configuration is correct.",
      );
    }
  }
}
