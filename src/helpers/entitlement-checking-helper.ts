import { Purchases } from "../main";

export function waitForEntitlement(
  purchases: Purchases,
  appUserId: string,
  entitlementIdentifier: string,
  maxAttempts: number = 10,
): Promise<boolean> {
  const waitMSBetweenAttempts = 1000;
  return new Promise<boolean>((resolve, reject) => {
    const checkForEntitlement = (checkCount = 1) =>
      purchases
        .isEntitledTo(appUserId, entitlementIdentifier)
        .then((hasEntitlement) => {
          if (checkCount > maxAttempts) {
            return resolve(false);
          }

          if (hasEntitlement) {
            return resolve(true);
          } else {
            setTimeout(
              () => checkForEntitlement(checkCount + 1),
              waitMSBetweenAttempts,
            );
          }
        })
        .catch(reject);

    checkForEntitlement();
  });
}
