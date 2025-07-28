export function isSandboxApiKey(apiKey: string): boolean {
  return apiKey ? apiKey.startsWith("rcb_sb_") : false;
}

export function isRCTestStoreApiKey(apiKey: string): boolean {
  return apiKey ? apiKey.startsWith("test_") : false;
}
