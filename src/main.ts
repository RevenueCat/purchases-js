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

  private static readonly _RC_STRIPE_PUB_KEY = import.meta.env
    .VITE_RC_STRIPE_PUB_KEY as string;

  constructor(apiKey: string) {
    this._API_KEY = apiKey;

    if (
      RCBilling._RC_ENDPOINT === undefined ||
      RCBilling._RC_STRIPE_PUB_KEY === undefined
    ) {
      console.error(
        "Project was build without some of the environment variables set",
      );
    }
  }

  public async logIn(appUserId: string): Promise<void> {
    this._APP_USER_ID = appUserId;

    const response = await fetch(
      `${RCBilling._RC_ENDPOINT}/v1/subscribers/${this._APP_USER_ID}`,
      {
        headers: {
          Authorization: `Bearer ${this._API_KEY}`,
        },
      },
    );

    const data = await response.text();
    console.log(data);
  }

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
    return toOfferingsPage(data);
  }
}

const toOfferingsPage = (data: ServerResponse) => {
  return {
    offerings: data.offerings.map(toOffering),
    priceByPackageId: data.prices_by_package_id,
  } as OfferingsPage;
};
