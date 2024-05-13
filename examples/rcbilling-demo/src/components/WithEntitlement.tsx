import { Purchases } from "@revenuecat/purchases-js";
import React, { useCallback, useEffect, useState } from "react";
import IChildrenProps from "./IChildrenProps";
import { usePurchasesLoaderData } from "../util/RouterLoader";
import { useNavigate } from "react-router-dom";

interface IWithEntitlementProps extends IChildrenProps {
  // purchases: Purchases;
  entitlementId: string;
  // onNotEntitled?: () => void;
  // onEntitled?: () => void;
  // maxAttempts?: number;
}

const WithEntitlement: React.FC<IWithEntitlementProps> = ({
  // purchases,
  entitlementId,
  children,
  // onNotEntitled,
  // onEntitled,
}) => {
  const { customerInfo, purchases } = usePurchasesLoaderData();
  const [isLoading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!customerInfo.entitlements.active[entitlementId]) {
      navigate(`/paywall/${purchases.getAppUserId()}`);
    } else {
      setLoading(false);
    }
  }, [customerInfo, purchases, entitlementId, navigate]);

  // const [isEntitled, setIsEntitled] = useState<boolean | null>(null);

  // const doCheckEntitlement = useCallback((): Promise<boolean> => {
  //   return purchases.isEntitledTo(entitlementId);
  // }, [purchases, entitlementId]);

  // useEffect(() => {
  //   (async () => {
  //     doCheckEntitlement().then((isEntitledTo) => {
  //       setIsEntitled(isEntitledTo);

  //       if (isEntitledTo) {
  //         if (onEntitled) onEntitled();
  //       } else {
  //         if (onNotEntitled) onNotEntitled();
  //       }
  //     });
  //   })();
  // }, [entitlementId, doCheckEntitlement, onEntitled, onNotEntitled]);

  // if (!isEntitled) {
  //   return null;
  // }
  return customerInfo && !isLoading ? <>{children}</> : null;

  // return <>{children}</>;
};

export default WithEntitlement;
