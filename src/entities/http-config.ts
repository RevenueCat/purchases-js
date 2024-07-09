/**
 * Parameters used to customise the http requests executed by purchases-js.
 * @public
 */
export interface HttpConfig {
  /**
   * Additional headers to include in all HTTP requests.
   */
  additionalHeaders?: Record<string, string>;
}

export const defaultHttpConfig = {};
