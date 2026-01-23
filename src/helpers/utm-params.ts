export const autoParseUTMParams = () => {
  // Guard against environments where window.location is not available
  const hasWindowLocation = typeof window !== "undefined" && window.location;
  const params = hasWindowLocation
    ? new URLSearchParams(window.location.search)
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
