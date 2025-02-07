import { VERSION } from "../helpers/constants";
import { type EventProperties } from "./event";

interface EventContext {
  library: {
    name: string;
    version: string;
  };
  locale: string;
  user_agent: string;
  time_zone: string;
  screen_size: {
    width: number;
    height: number;
  };
  utm: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
    content: string | null;
    term: string | null;
  };
  page: {
    referrer: string;
    url: string;
    title: string;
  };
}

export function buildEventContext(): EventContext & EventProperties {
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
      referrer: document.referrer,
      url: window.location.href,
      title: document.title,
    },
  };
}
