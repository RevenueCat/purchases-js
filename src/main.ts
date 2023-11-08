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
}
