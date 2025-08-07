export function isSandboxApiKey(apiKey: string): boolean {
  return apiKey ? apiKey.startsWith("rcb_sb_") : false;
}

export function isSimulatedStoreApiKey(apiKey: string): boolean {
  return apiKey ? apiKey.startsWith("test_") : false;
}
