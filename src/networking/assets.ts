export const buildAssetURL = (assetPath: string): string => {
  const assetsBaseUrl = (import.meta.env.VITE_ASSETS_ENDPOINT as string) || "";
  return `${assetsBaseUrl}/${assetPath}`;
};
