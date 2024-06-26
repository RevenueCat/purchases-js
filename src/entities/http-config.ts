/**
 * Parameters used to customise the http requests executed by purchases-js.
 * @public
 */
export interface HttpConfig {
  /**
   * If true uses credentials:'include' when executing XHR requests.
   */
  includeCredentials?: boolean;
}
