export function camelToUnderscore(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const underscoreKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      const value = obj[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        result[underscoreKey] = camelToUnderscore(
          value as Record<string, unknown>,
        );
      } else {
        result[underscoreKey] = value;
      }
    }
  }
  return result;
}
