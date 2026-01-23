import { VERSION } from "../helpers/constants";
import { type EventContext } from "./event";

export type SDKEventContextSource = "sdk" | "wpl" | string;

export interface SDKEventContext {
  libraryName: string;
  libraryVersion: string;
  locale: string;
  userAgent: string;
  timeZone: string;
  screenWidth: number | null;
  screenHeight: number | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  pageReferrer: string | null;
  pageUrl: string;
  pageTitle: string | null;
  source: SDKEventContextSource; // Describes where the event was triggered from
  rcSource: string | null; // Describes where the purchase was originated
}

export function buildEventContext(
  source: SDKEventContextSource,
  rcSource: string | null,
): SDKEventContext & EventContext {
  // Guard against environments where window.location is not available
  const hasWindowLocation = typeof window !== "undefined" && window.location;
  const urlParams = hasWindowLocation
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();

  let screenWidth: number | null = null;
  let screenHeight: number | null = null;
  if (typeof screen !== "undefined" && screen) {
    screenWidth = screen.width;
    screenHeight = screen.height;
  }
  let pageReferrer: string | null = null;
  let pageTitle: string | null = null;
  if (typeof document !== "undefined" && document) {
    pageReferrer = document.referrer;
    pageTitle = document.title;
  }

  return {
    libraryName: "purchases-js",
    libraryVersion: VERSION,
    locale: navigator.language,
    userAgent: navigator.userAgent,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenWidth: screenWidth,
    screenHeight: screenHeight,
    utmSource: urlParams.get("utm_source") ?? null,
    utmMedium: urlParams.get("utm_medium") ?? null,
    utmCampaign: urlParams.get("utm_campaign") ?? null,
    utmContent: urlParams.get("utm_content") ?? null,
    utmTerm: urlParams.get("utm_term") ?? null,
    pageReferrer: pageReferrer,
    pageUrl: hasWindowLocation
      ? `${window.location.origin}${window.location.pathname}`
      : "",
    pageTitle: pageTitle,
    source: source,
    rcSource: rcSource,
  };
}
