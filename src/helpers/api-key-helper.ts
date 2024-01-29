export function isSandboxApiKey(apiKey: string): boolean {
  return apiKey ? apiKey.startsWith("rcb_sb_") : false;
}
