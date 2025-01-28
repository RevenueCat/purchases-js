export function camelToUnderscore(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const underscoreKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      result[underscoreKey] = obj[key];
    }
  }
  return result;
}
