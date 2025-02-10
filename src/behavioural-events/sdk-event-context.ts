import { VERSION } from "../helpers/constants";
import { type EventContext } from "./event";

export type SDKEventContextSource = "sdk" | "wpl" | string;

export interface SDKEventContext {
  libraryName: string;
  libraryVersion: string;
  locale: string;
  userAgent: string;
  timeZone: string;
  screenWidth: number;
  screenHeight: number;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  pageReferrer: string;
  pageUrl: string;
  pageTitle: string;
  source: SDKEventContextSource;
}

export function buildEventContext(
  source: SDKEventContextSource,
): SDKEventContext & EventContext {
  const urlParams = new URLSearchParams(window.location.search);

  return {
    libraryName: "purchases-js",
    libraryVersion: VERSION,
    locale: navigator.language,
    userAgent: navigator.userAgent,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenWidth: screen.width,
    screenHeight: screen.height,
    utmSource: urlParams.get("utm_source") ?? null,
    utmMedium: urlParams.get("utm_medium") ?? null,
    utmCampaign: urlParams.get("utm_campaign") ?? null,
    utmContent: urlParams.get("utm_content") ?? null,
    utmTerm: urlParams.get("utm_term") ?? null,
    pageReferrer: document.referrer,
    pageUrl: window.location.href,
    pageTitle: document.title,
    source: source,
  };
}
