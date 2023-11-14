import {
  Offering as InnerOffering,
  OfferingsPage as InnerOfferingsPage,
  Package as InnerPackage,
  ServerResponse,
  toOffering,
} from "./entities/offerings";
import { Entitlement, toEntitlement } from "./entities/entitlements";

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

  private toOfferingsPage = (data: ServerResponse) => {
    return {
      offerings: data.offerings.map(toOffering),
      priceByPackageId: data.prices_by_package_id,
    } as OfferingsPage;
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
    const entitlements = await this.getEntitlements(appUserId);
    return entitlements.includes(entitlementIdentifier);
  }

  public async getEntitlements(appUserId: string): Promise<Entitlement[]> {
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
      return [];
    }

    const data = await response.json();
    return data.entitlements.map(toEntitlement);
  }
}

export class Session {
  private readonly purchases: Purchases;
  private loggedAppUserId: string;
  private loggedAppUserEntitlements: Entitlement[];

  constructor(apiKey: string) {
    this.purchases = new Purchases(apiKey);
  }

  async logIn(appUserId: string): Promise<void> {
    this.loggedAppUserEntitlements =
      await this.purchases.getEntitlements(appUserId);
    this.loggedAppUserId = appUserId;
  }

  async isUserEntitled(entitlementId: string): boolean {
    return this.loggedAppUserEntitlements.map((e) => identifier);
  }
}
