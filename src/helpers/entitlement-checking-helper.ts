import { EntitlementResponse } from "../networking/responses/entitlements-response";
import { Backend } from "../networking/backend";

export function waitForEntitlement(
  backend: Backend,
  appUserId: string,
  entitlementIdentifier: string,
  maxAttempts: number = 10,
): Promise<boolean> {
  const waitMSBetweenAttempts = 1000;
  return new Promise<boolean>((resolve, reject) => {
    const checkForEntitlement = (checkCount = 1) =>
      isEntitledTo(backend, appUserId, entitlementIdentifier)
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

async function isEntitledTo(
  backend: Backend,
  appUserId: string,
  entitlementIdentifier: string,
): Promise<boolean> {
  const entitlementsResponse = await backend.getEntitlements(appUserId);

  const entitlements = entitlementsResponse.entitlements.map(
    (ent: EntitlementResponse) => ent.lookup_key,
  );
  return entitlements.includes(entitlementIdentifier);
}
