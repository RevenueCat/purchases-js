export declare class RCBilling {
  _API_KEY: string | null;
  _APP_USER_ID: string | null;
  private static readonly _RC_ENDPOINT;
  private static readonly _RC_STRIPE_PUB_KEY;
  isStripeDefined: boolean;
  stripeInstance: any;
  constructor(apiKey: string);
  logIn(appUserId: string): Promise<void>;
}
