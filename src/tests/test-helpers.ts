import { expect } from "vitest";
import { PurchasesError } from "../entities/errors";
import { type Offerings } from "../entities/offerings";

export function failTest() {
  expect(true).toBeFalsy();
}

export function assertExpectedOfferings(
  offerings: Offerings,
  expectedOfferings: Offerings,
) {
  expect(offerings.all).toEqual(expectedOfferings.all);
  expect(offerings.current).toEqual(expectedOfferings.current);
}

export function verifyExpectedError(e: unknown, expectedError: PurchasesError) {
  expect(e).toBeInstanceOf(PurchasesError);
  const purchasesError = e as PurchasesError;
  expect(purchasesError.errorCode).toEqual(expectedError.errorCode);
  expect(purchasesError.message).toEqual(expectedError.message);
  expect(purchasesError.underlyingErrorMessage).toEqual(
    expectedError.underlyingErrorMessage,
  );
}

export function expectPromiseToError(
  f: Promise<unknown>,
  expectedError: PurchasesError,
) {
  return f.then(
    () => failTest(),
    (e) => verifyExpectedError(e, expectedError),
  );
}
