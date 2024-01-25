import { expect } from "vitest";
import { PurchasesError } from "../entities/errors";

export function failTest() {
  expect(true).toBeFalsy();
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
