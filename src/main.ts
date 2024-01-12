import {
  Offering as InnerOffering,
  OfferingsPage as InnerOfferingsPage,
  Package as InnerPackage,
  toOffering,
} from "./entities/offerings";
import {
  SubscribeResponse,
  toSubscribeResponse,
} from "./entities/subscribe-response";
import { ServerResponse } from "./entities/types";

import { StatusCodes } from "http-status-codes";
import {
  AlreadySubscribedError,
  ConcurrentSubscriberAttributeUpdateError,
  InvalidInputDataError,
  PaymentGatewayError,
  UnknownServerError,
} from "./entities/errors";

export type OfferingsPage = InnerOfferingsPage;
export type Offering = InnerOffering;
export type Package = InnerPackage;

const VERSION = "0.0.8";

export class Purchases {
  _API_KEY: string | null = null;
  _APP_USER_ID: string | null = null;
  private static readonly _RC_ENDPOINT = import.meta.env
    .VITE_RC_ENDPOINT as string;
  private static readonly _BASE_PATH = "rcbilling/v1";

  constructor(apiKey: string) {
    this._API_KEY = apiKey;

    if (Purchases._RC_ENDPOINT === undefined) {
      console.error(
        "Project was build without some of the environment variables set",
      );
    }
  }

  private toOfferingsPage = (
    offeringsData: ServerResponse,
    productsData: ServerResponse,
  ): OfferingsPage => {
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

    return {
      all: offeringsData.offerings.map((o: ServerResponse) =>
        toOffering(o, productsMap),
      ),
      current: currentOffering,
    };
  };

  public async listOfferings(appUserId: string): Promise<OfferingsPage> {
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
    return this.toOfferingsPage(offeringsData, productsData);
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
          email: email,
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

  public async getPackage(
    appUserId: string,
    packageIdentifier: string,
  ): Promise<Package | null> {
    const offeringsPage = await this.listOfferings(appUserId);
    const packages: Package[] = [];
    offeringsPage.all.forEach((offering) =>
      packages.push(...offering.packages),
    );

    const filteredPackages: Package[] = packages.filter(
      (pakg) => pakg.identifier === packageIdentifier,
    );
    if (filteredPackages.length === 0) {
      return null;
    }

    return filteredPackages[0];
  }
}
