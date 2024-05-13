import React, { useEffect, useState } from "react";
import IChildrenProps from "./IChildrenProps";
import { usePurchasesLoaderData } from "../util/PurchasesLoader";
import { useNavigate } from "react-router-dom";

interface IWithEntitlementProps extends IChildrenProps {
  entitlementId: string;
}

const WithEntitlement: React.FC<IWithEntitlementProps> = ({
  entitlementId,
  children,
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

  return customerInfo && !isLoading ? <>{children}</> : null;
};

export default WithEntitlement;
