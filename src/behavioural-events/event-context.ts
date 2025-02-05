import { VERSION } from "../helpers/constants";

export function buildEventContext() {
  const urlParams = new URLSearchParams(window.location.search);

  return {
    library: {
      name: "purchases-js",
      version: VERSION,
    },
    locale: navigator.language,
    user_agent: navigator.userAgent,
    time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen_size: {
      width: screen.width,
      height: screen.height,
    },
    utm: {
      source: urlParams.get("utm_source") ?? null,
      medium: urlParams.get("utm_medium") ?? null,
      campaign: urlParams.get("utm_campaign") ?? null,
      content: urlParams.get("utm_content") ?? null,
      term: urlParams.get("utm_term") ?? null,
    },
    page: {
      path: window.location.pathname,
      referrer: document.referrer,
      search: window.location.search,
      url: window.location.href,
      title: document.title,
    },
  };
}
