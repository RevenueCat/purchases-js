import React, { useEffect, useState } from "react";
import IChildrenProps from "./IChildrenProps";
import { usePurchasesLoaderData } from "../util/PurchasesLoader";
import { useNavigate } from "react-router-dom";

interface IWithoutEntitlementProps extends IChildrenProps {
  entitlementId: string;
}

const WithoutEntitlement: React.FC<IWithoutEntitlementProps> = ({
  entitlementId,
  children,
}) => {
  const { customerInfo, purchases } = usePurchasesLoaderData();
  const [isLoading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (customerInfo.entitlements.active[entitlementId]) {
      navigate(`/success/${purchases.getAppUserId()}`);
    } else {
      setLoading(false);
    }
  }, [customerInfo, purchases, entitlementId, navigate]);

  return customerInfo && !isLoading ? <>{children}</> : null;
};

export default WithoutEntitlement;
