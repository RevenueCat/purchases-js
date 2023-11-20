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

export type OfferingsPage = InnerOfferingsPage;
export type Offering = InnerOffering;
export type Package = InnerPackage;

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

  private toOfferingsPage = (data: ServerResponse): OfferingsPage => {
    return {
      offerings: data.offerings.map(toOffering),
      priceByPackageId: data.prices_by_package_id,
    };
  };

  public async listOfferings(): Promise<OfferingsPage> {
    const response = await fetch(
      `${Purchases._RC_ENDPOINT}/${Purchases._BASE_PATH}/offerings`,
      {
        headers: {
          Authorization: `Bearer ${this._API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    const data = await response.json();
    return this.toOfferingsPage(data);
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
        }),
      },
    );

    const data = await response.json();
    return toSubscribeResponse(data);
  }

  public async getPackage(packageIdentifier: string): Promise<Package | null> {
    const offeringsPage = await this.listOfferings();
    const packages: Package[] = [];
    offeringsPage.offerings.forEach((offering) =>
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
