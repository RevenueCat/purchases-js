/**
 * Parameters used to customise the http requests executed by purchases-js.
 * @public
 */
export interface HttpConfig {
  /**
   * Additional headers to include in all HTTP requests.
   */
  additionalHeaders?: Record<string, string>;
  /**
   * Set this property to your proxy URL *only* if you've received a proxy
   * key value from your RevenueCat contact. This value should never end with
   * a trailing slash.
   */
  proxyURL?: string;
  /**
   * Override the base URL for analytics/events tracking in local development.
   * Default: the built-in analytics endpoint (e.revenue.cat).
   * This value should never end with a trailing slash.
   * @internal
   */
  eventsURL?: string;
}

export const defaultHttpConfig = {} as HttpConfig;
