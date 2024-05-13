import {
  Offering,
  Offerings,
  Package,
  Purchases,
  PurchasesError,
} from "@revenuecat/purchases-js";
import React, { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import { usePurchasesLoaderData } from "../../util/RouterLoader";
import Button from "../../components/Button";

interface IPackageCardProps {
  pkg: Package;
  offering: Offering;
  onClick: () => void;
}

const priceLabels: Record<string, string> = {
  P3M: "quarter",
  P1M: "mo",
  P1Y: "yr",
  P2M: "2mo",
  P1D: "day",
  PT1H: "hour",
  P1W: "week",
};

export const PackageCard: React.FC<IPackageCardProps> = ({
  pkg,
  offering,
  onClick,
}) => {
  const originalPriceByProduct: Record<string, string> | null =
    (offering.metadata?.original_price_by_product as Record<string, string>) ??
    null;
  return (
    <div className="card">
      {pkg.rcBillingProduct !== null && pkg.rcBillingProduct.currentPrice && (
        <>
          <div className="previousPrice">
            {originalPriceByProduct &&
              originalPriceByProduct[pkg.rcBillingProduct.identifier]}
          </div>
          <div className="currentPrice">
            <div>{`${pkg.rcBillingProduct?.currentPrice?.formattedPrice}`}</div>

            {pkg.rcBillingProduct.normalPeriodDuration && (
              <div>
                /
                {priceLabels[pkg.rcBillingProduct.normalPeriodDuration] ||
                  pkg.rcBillingProduct.normalPeriodDuration}
              </div>
            )}
          </div>
          <div className="productName">{pkg.rcBillingProduct.displayName}</div>
          <div className="packageCTA">
            <Button caption="Choose plan" onClick={onClick} />
          </div>
        </>
      )}
    </div>
  );
};

interface IPaywallPageProps {
  // purchases: Purchases;
}

const PaywallPage: React.FC<IPaywallPageProps> = () => {
  // const [offerings, setOfferings] = useState<Offerings | null>(null);

  // useEffect(() => {
  //   purchases.getOfferings().then((offerings) => {
  //     setOfferings(offerings);
  //   });
  // }, [purchases]);

  // if (offerings === null) {
  //   return null;
  // }

  const navigate = useNavigate();
  const { purchases, offerings } = usePurchasesLoaderData();

  const currentOffering = offerings.current;
  if (!currentOffering) {
    console.error("No current offering found");
    return;
  }
  const packages: Package[] = currentOffering?.availablePackages || [];
  if (packages.length == 0) {
    console.error("No packages found in current offering.");
  }

  const onPackageCardClicked = async (pkg: Package) => {
    if (!pkg.rcBillingProduct) {
      return;
    }

    // How do we complete the purchase?
    try {
      const { customerInfo } = await purchases.purchasePackage(pkg);

      console.log(`CustomerInfo after purchase: ${customerInfo}`);

      // window.location.href = "/success";
      navigate(`/success/${purchases.getAppUserId()}`);
    } catch (e) {
      if (e instanceof PurchasesError) {
        console.log(`Error performing purchase: ${e}`);
        // TODO: We should display an error here.
        // navigate("/");
        // window.location.href = "/";
      } else {
        console.error(`Unknown error: ${e}`);
      }
    }
  };

  console.log(packages);
  console.log(offerings);

  return (
    <>
      <div className="paywall">
        <h1>
          Subscribe today and <em>save up to 25%!</em>
        </h1>
        <div className="packages">
          {packages.map((pkg) =>
            pkg.rcBillingProduct !== null ? (
              <PackageCard
                key={pkg.identifier}
                pkg={pkg}
                offering={currentOffering}
                onClick={() => onPackageCardClicked(pkg)}
              />
            ) : null,
          )}
        </div>
        <div className="notice">
          This is only a demo web paywall. No payment will be actually
          processed.
        </div>
      </div>
    </>
  );
};

export default PaywallPage;
