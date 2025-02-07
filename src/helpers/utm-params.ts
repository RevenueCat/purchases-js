export const autoParseUTMParams = () => {
  const params = new URLSearchParams(window.location.search);

  const possible_params = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ];
  const utmParams: { [key: string]: string } = {};

  possible_params.forEach((param) => {
    const paramValue = params.get(param);
    if (paramValue !== null) {
      utmParams[param] = paramValue;
    }
  });

  return utmParams;
};
