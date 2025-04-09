import type { Page } from "@playwright/test";

const _LOCAL_URL = "http://localhost:3001/";

export function getUserId(browserName: string) {
  return `rc_billing_demo_test_${Date.now()}_${browserName}`;
}

export async function navigateToUrl(
  page: Page,
  userId: string,
  queryString?: {
    offeringId?: string;
    useRcPaywall?: boolean;
    lang?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    optOutOfAutoUTM?: boolean;
    email?: string;
  },
): Promise<void> {
  const baseUrl =
    (import.meta.env?.VITE_RC_BILLING_DEMO_URL as string | undefined) ??
    _LOCAL_URL;

  const {
    offeringId,
    useRcPaywall,
    lang,
    utm_source,
    utm_campaign,
    utm_term,
    utm_content,
    utm_medium,
    optOutOfAutoUTM,
    email,
  } = queryString ?? {};

  const params = new URLSearchParams();
  if (offeringId) {
    params.append("offeringId", offeringId);
  }
  if (lang) {
    params.append("lang", lang);
  }
  if (utm_source) {
    params.append("utm_source", utm_source);
  }
  if (utm_content) {
    params.append("utm_content", utm_content);
  }
  if (utm_term) {
    params.append("utm_term", utm_term);
  }
  if (utm_medium) {
    params.append("utm_medium", utm_medium);
  }
  if (utm_campaign) {
    params.append("utm_campaign", utm_campaign);
  }
  if (optOutOfAutoUTM) {
    params.append("optOutOfAutoUTM", optOutOfAutoUTM.toString());
  }
  if (email) {
    params.append("email", email);
  }

  const url = `${baseUrl}${useRcPaywall ? "rc_paywall" : "paywall"}/${encodeURIComponent(userId)}?${params.toString()}`;
  await page.goto(url);
}
