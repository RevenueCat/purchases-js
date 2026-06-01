const rc_api_key_regex = /^rcb_[a-zA-Z0-9_.-]+$/;
const paddle_api_key_regex = /^pdl_[a-zA-Z0-9_.-]+$/;
const rc_simulated_store_api_key_regex = /^test_[a-zA-Z0-9_.-]+$/;
const stripe_api_key_regex = /^strp_[a-zA-Z0-9_.-]+$/;

export function isWebBillingSandboxApiKey(apiKey: string): boolean {
  return apiKey ? apiKey.startsWith("rcb_sb_") : false;
}

export function isWebBillingApiKey(apiKey: string): boolean {
  return apiKey ? rc_api_key_regex.test(apiKey) : false;
}

export function isPaddleApiKey(apiKey: string): boolean {
  return apiKey ? paddle_api_key_regex.test(apiKey) : false;
}

export function isStripeApiKey(apiKey: string): boolean {
  return apiKey ? stripe_api_key_regex.test(apiKey) : false;
}

export function isSimulatedStoreApiKey(apiKey: string): boolean {
  return apiKey ? rc_simulated_store_api_key_regex.test(apiKey) : false;
}
