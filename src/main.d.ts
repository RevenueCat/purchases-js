export declare class Purchases {
  _API_KEY: string | null;
  _APP_USER_ID: string | null;
  private static readonly _RC_ENDPOINT;
  constructor(apiKey: string);
  logIn(appUserId: string): Promise<void>;
}
