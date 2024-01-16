import { Purchases } from "@revenuecat/purchases-js";
import React, { useCallback, useEffect, useState } from "react";
import IChildrenProps from "./IChildrenProps";

interface IWithEntitlementProps extends IChildrenProps {
  purchases: Purchases;
  appUserId: string;
  entitlementId: string;
  onNotEntitled?: () => void;
  onEntitled?: () => void;
  maxAttempts?: number;
}

const WithEntitlement: React.FC<IWithEntitlementProps> = ({
  purchases,
  appUserId,
  entitlementId,
  children,
  onNotEntitled,
  onEntitled,
}) => {
  const [isEntitled, setIsEntitled] = useState<boolean | null>(null);

  const doCheckEntitlement = useCallback((): Promise<boolean> => {
    return purchases.isEntitledTo(appUserId, entitlementId);
  }, [purchases, appUserId, entitlementId]);

  useEffect(() => {
    (async () => {
      doCheckEntitlement().then((isEntitledTo) => {
        setIsEntitled(isEntitledTo);

        if (isEntitledTo) {
          if (onEntitled) onEntitled();
        } else {
          if (onNotEntitled) onNotEntitled();
        }
      });
    })();
  }, [appUserId, entitlementId, doCheckEntitlement, onEntitled, onNotEntitled]);

  if (!isEntitled) {
    return null;
  }

  return <>{children}</>;
};

export default WithEntitlement;
