import {
  Offering as InnerOffering,
  OfferingsPage as InnerOfferingsPage,
  Package as InnerPackage,
  ServerResponse,
  toOffering,
} from "./entities/offerings";

export type OfferingsPage = InnerOfferingsPage;
export type Offering = InnerOffering;
export type Package = InnerPackage;

export class RCBilling {
  _API_KEY: string | null = null;
  _APP_USER_ID: string | null = null;
  private static readonly _RC_ENDPOINT = import.meta.env
    .VITE_RC_ENDPOINT as string;
  private static readonly _BASE_PATH = "rcbilling/v1";

  constructor(apiKey: string) {
    this._API_KEY = apiKey;

    if (RCBilling._RC_ENDPOINT === undefined) {
      console.error(
        "Project was build without some of the environment variables set",
      );
    }
  }

  public async logIn(appUserId: string): Promise<void> {
    await fetch(
      `${RCBilling._RC_ENDPOINT}/${RCBilling._BASE_PATH}/entitlements/${appUserId}`,
      {
        headers: {
          Authorization: `Bearer ${this._API_KEY}`,
        },
      },
    );
  }

  private toOfferingsPage = (data: ServerResponse) => {
    return {
      offerings: data.offerings.map(toOffering),
      priceByPackageId: data.prices_by_package_id,
    } as OfferingsPage;
  };

  public async listOfferings(): Promise<OfferingsPage> {
    const response = await fetch(
      `${RCBilling._RC_ENDPOINT}/rcbilling/v1/offerings`,
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
      `${RCBilling._RC_ENDPOINT}/rcbilling/v1/entitlements/${appUserId}`,
      {
        headers: {
          Authorization: `Bearer ${this._API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    console.log(response.status);

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
}
