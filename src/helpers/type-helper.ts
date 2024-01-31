export function notEmpty<Type>(value: Type | null | undefined): value is Type {
  return value !== null && value !== undefined;
}
