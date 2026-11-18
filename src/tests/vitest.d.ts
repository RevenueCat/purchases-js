import "vitest";

interface CustomMatchers<R = unknown> {
  toHaveBeenCalledExactlyOnceWith(...expectedArgs: unknown[]): R;
}

declare module "vitest" {
  // oxlint-disable-next-line typescript/no-explicit-any
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
