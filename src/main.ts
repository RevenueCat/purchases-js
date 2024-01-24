import {
  Offering as InnerOffering,
  Offerings as InnerOfferings,
  Package as InnerPackage,
  toOffering,
} from "./entities/offerings";
import { PaymentProviderSettings, ServerResponse } from "./entities/types";
import RCPurchasesUI from "./ui/rcb-ui.svelte";

import {
  CustomerInfo as InnerCustomerInfo,
  toCustomerInfo,
} from "./entities/customer-info";
import { BASE_PATH, RC_ENDPOINT } from "./helpers/network-configuration";
import { waitForEntitlement } from "./helpers/entitlement-checking-helper";
import { ServerError } from "./entities/errors";

export type Offerings = InnerOfferings;
export type Offering = InnerOffering;
export type Package = InnerPackage;
export type CustomerInfo = InnerCustomerInfo;
export type {
  EntitlementInfos,
  EntitlementInfo,
} from "./entities/customer-info";

const VERSION = "0.0.8";

export class Purchases {
  // @internal
  _API_KEY: string | null = null;
  // @internal
  _APP_USER_ID: string | null = null;
  // @internal
  _PAYMENT_PROVIDER_SETTINGS: PaymentProviderSettings | null = null;

  constructor(
    apiKey: string,
    paymentProviderSettings: PaymentProviderSettings,
  ) {
    this._API_KEY = apiKey;
    this._PAYMENT_PROVIDER_SETTINGS = paymentProviderSettings;

    if (RC_ENDPOINT === undefined) {
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
      console.debug(
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
      `${RC_ENDPOINT}/v1/subscribers/${appUserId}/offerings`,
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
      `${RC_ENDPOINT}/${BASE_PATH}/subscribers/${appUserId}/products?id=${productIds.join("&id=")}`,
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
      `${RC_ENDPOINT}/${BASE_PATH}/entitlements/${appUserId}`,
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

  public purchasePackage(
    appUserId: string,
    rcPackage: Package,
    entitlementId: string, // TODO: Remove this parameter once we don't have to poll for entitlements
    {
      environment,
      customerEmail,
      htmlTarget,
    }: {
      environment?: "sandbox" | "production";
      customerEmail?: string;
      htmlTarget?: HTMLElement;
    } = { environment: "production" },
  ): Promise<boolean> {
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
          onFinished: async () => {
            const hasEntitlement = await waitForEntitlement(
              this,
              appUserId,
              entitlementId,
            );
            resolve(hasEntitlement);
            certainHTMLTarget.innerHTML = "";
          },
          onClose: () => {
            resolve(false);
            certainHTMLTarget.innerHTML = "";
          },
          purchases: this,
          asModal,
        },
      });
    });
  }

  public async getCustomerInfo(appUserId: string): Promise<CustomerInfo> {
    // TODO: Abstract network requests to avoid duplication
    const response = await fetch(`${RC_ENDPOINT}/v1/subscribers/${appUserId}`, {
      headers: {
        Authorization: `Bearer ${this._API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Platform": "web",
        "X-Version": VERSION,
      },
    });

    const status = response.status;
    if (status >= 400) {
      // TODO: Handle errors better
      throw new ServerError(status, await response.text());
    }

    const data = await response.json();

    return toCustomerInfo(data);
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
