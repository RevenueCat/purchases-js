export function isApiKeySandbox(apiKey: string): boolean {
  return apiKey ? apiKey.startsWith("rcb_sb_") : false;
}
