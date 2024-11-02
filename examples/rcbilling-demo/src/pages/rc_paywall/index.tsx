import { Offering, Package, Purchases } from "@revenuecat/purchases-js";
import React, { useEffect } from "react";
import { usePurchasesLoaderData } from "../../util/PurchasesLoader";
import Button from "../../components/Button";
import LogoutButton from "../../components/LogoutButton";

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
  PT1H: "hr",
  P1W: "wk",
};

const trialLabels: Record<string, string> = {
  P3D: "3 days",
  P1W: "1 week",
  P2W: "2 weeks",
  P1M: "1 month",
  P2M: "2 months",
  P3M: "3 months",
  P6M: "6 months",
  P1Y: "1 year",
};

export const PackageCard: React.FC<IPackageCardProps> = ({
  pkg,
  offering,
  onClick,
}) => {
  const originalPriceByProduct: Record<string, string> | null =
    (offering.metadata?.original_price_by_product as Record<string, string>) ??
    null;

  const option = pkg.rcBillingProduct.defaultSubscriptionOption;

  const price = option ? option.base.price : pkg.rcBillingProduct.currentPrice;
  const originalPrice = originalPriceByProduct
    ? originalPriceByProduct[pkg.rcBillingProduct.identifier]
    : null;

  const trial = option?.trial;
  return (
    <div className="card">
      {trial && (
        <div className="freeTrial">
          {trial.periodDuration &&
            (trialLabels[trial.periodDuration] || trial.periodDuration)}{" "}
          free trial
        </div>
      )}
      {price && (
        <>
          {!trial && originalPrice && (
            <div className="previousPrice">{originalPrice}</div>
          )}
          <div className="currentPrice">
            <div>{`${price.formattedPrice}`}</div>

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
            <Button
              caption={option?.trial ? "Start Free Trial" : "Choose plan"}
              onClick={onClick}
            />
          </div>
        </>
      )}
    </div>
  );
};

const RCPaywallPage: React.FC = () => {
  const { offering } = usePurchasesLoaderData();

  useEffect(() => {
    const target = document.getElementById("paywall");
    if (!offering || target?.innerHTML !== "") {
      return;
    }

    const purchases = Purchases.getSharedInstance();
    purchases
      .renderPaywall({
        offering: offering,
        htmlTarget: document.getElementById("paywall") || undefined,
      })
      .then((x) => console.log(x))
      .catch((err) => console.log(err));
  }, [offering]);

  if (!offering) {
    console.error("No offering found");
    return <>No offering found!</>;
  }

  return (
    <>
      <LogoutButton />
      <div id="paywall"></div>
    </>
  );
};

export default RCPaywallPage;
