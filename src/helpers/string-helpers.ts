export const capitalize = (value: string) => {
  try {
    return value.charAt(0).toUpperCase() + value.slice(1);
  } catch {
    return value;
  }
};
