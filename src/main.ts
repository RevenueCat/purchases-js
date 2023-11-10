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

  public async logIn(appUserId: string): Promise<void> {
    this._APP_USER_ID = appUserId;

    const response = await fetch(
      `${Purchases._RC_ENDPOINT}/${Purchases._BASE_PATH}/entitlements/${this._APP_USER_ID}`,
      {
        headers: {
          Authorization: `Bearer ${this._API_KEY}`,
        },
      },
    );

    const data = await response.text();
  }
}
