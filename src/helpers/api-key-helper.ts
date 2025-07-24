export function isSandboxApiKey(apiKey: string): boolean {
  return apiKey ? apiKey.startsWith("rcb_sb_") : false;
}

export function isRCSandboxApiKey(apiKey: string): boolean {
  return apiKey ? apiKey.startsWith("rc_sbx_") : false;
}
