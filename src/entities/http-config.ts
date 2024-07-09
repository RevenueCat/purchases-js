/**
 * Parameters used to customise the http requests executed by purchases-js.
 * @public
 */
export interface HttpConfig {
  /**
   * If true uses credentials:'include' when executing XHR requests.
   */
  includeCredentials?: boolean;
  /**
   * Additional headers to include in all HTTP requests.
   */
  additionalHeaders?: Record<string, string>;
}

export const defaultHttpConfig = { includeCredentials: false };
