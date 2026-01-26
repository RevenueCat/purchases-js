import { getNullableWindow } from "./browser-globals";

export const autoParseUTMParams = () => {
  // Guard against environments where window.location is not available
  const win = getNullableWindow();
  const params = win?.location
    ? new URLSearchParams(win.location.search)
    : new URLSearchParams();

  const possibleParams = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ];
  const utmParams: { [key: string]: string } = {};

  possibleParams.forEach((param) => {
    const paramValue = params.get(param);
    if (paramValue !== null) {
      utmParams[param] = paramValue;
    }
  });

  return utmParams;
};
