import type { PropsWithChildren } from "react";
import React, { useEffect, useState } from "react";
import { usePurchasesLoaderData } from "../util/PurchasesLoader";
import { useNavigate } from "react-router-dom";

const WithoutEntitlement: React.FC<PropsWithChildren> = ({ children }) => {
  const { customerInfo, purchases } = usePurchasesLoaderData();
  const [isLoading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (Object.keys(customerInfo.entitlements.active).length > 0) {
      navigate(`/success/${purchases.getAppUserId()}`);
    } else {
      setLoading(false);
    }
  }, [customerInfo, purchases, navigate]);

  return customerInfo && !isLoading ? <>{children}</> : null;
};

export default WithoutEntitlement;
