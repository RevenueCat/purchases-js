export const autoParseUTMParams = () => {
  const params = new URLSearchParams(window.location.search);

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
