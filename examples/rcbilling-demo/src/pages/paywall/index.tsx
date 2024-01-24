import { Offerings, Package, Purchases } from "@revenuecat/purchases-js";
import React, { useEffect, useState } from "react";
import { catServicesEntitlementId } from "../../App.tsx";

interface IPackageCardProps {
  pkg: Package;
  onClick?: () => void;
}

const priceLabels: Record<string, string> = {
  P3M: "quarterly",
  P1M: "monthly",
  P1Y: "yearly",
  P2W: "2 months",
  P1D: "daily",
  PT1H: "hourly",
  P1W: "weekly",
};

export const PackageCard: React.FC<IPackageCardProps> = ({ pkg, onClick }) => {
  return (
    <div className={`card ${onClick && "clickableCard"}`} onClick={onClick}>
      {pkg.rcBillingProduct !== null && pkg.rcBillingProduct.currentPrice && (
        <>
          <h3>{pkg.rcBillingProduct.displayName}</h3>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
            }}
          >
            <h2>{`${(pkg.rcBillingProduct?.currentPrice?.amount / 100).toFixed(
              2,
            )} ${pkg.rcBillingProduct?.currentPrice?.currency}`}</h2>

            {pkg.rcBillingProduct.normalPeriodDuration && (
              <h3>
                &nbsp;/
                {priceLabels[pkg.rcBillingProduct.normalPeriodDuration] ||
                  pkg.rcBillingProduct.normalPeriodDuration}
              </h3>
            )}
          </div>
        </>
      )}
    </div>
  );
};

interface IPaywallPageProps {
  purchases: Purchases;
  appUserId: string;
}

const PaywallPage: React.FC<IPaywallPageProps> = ({ purchases, appUserId }) => {
  const [offerings, setOfferings] = useState<Offerings | null>(null);

  useEffect(() => {
    purchases.getOfferings(appUserId).then((offerings) => {
      setOfferings(offerings);
    });
  }, [purchases, appUserId]);

  if (offerings === null) {
    return null;
  }

  const packages: Package[] = offerings.current?.packages ?? [];
  if (packages.length == 0) {
    console.log("No current offering or packages found");
  }

  const onPackageCardClicked = async (pkg: Package) => {
    if (!pkg.rcBillingProduct) {
      return;
    }

    // How do we complete the purchase?
    const hasEntitlement = await purchases.purchasePackage(
      appUserId,
      pkg,
      catServicesEntitlementId,
      {
        environment: "sandbox",
      },
    );

    if (hasEntitlement) {
      window.location.href = "/success";
    } else {
      console.log("Purchased package but entitlement was not granted");
      // TODO: We should display an error here.
      window.location.href = "/";
    }
  };

  console.log(packages);
  console.log(offerings);

  return (
    <>
      <div>
        <h2>
          You are not subscribed to <br /> your cat's services🙀
        </h2>

        <p>
          Choose a package to show all the love you have for your little pet.
          <br />
          Or maybe just to avoid its revenge!
        </p>

        <div style={{ display: "flex", marginTop: "60px" }}>
          {packages.map((pkg) =>
            pkg.rcBillingProduct !== null ? (
              <PackageCard
                pkg={pkg}
                onClick={() => onPackageCardClicked(pkg)}
              />
            ) : null,
          )}
        </div>
      </div>
    </>
  );
};

export default PaywallPage;
