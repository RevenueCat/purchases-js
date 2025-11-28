import type {
  Offering,
  Package,
  PurchaseResult,
  Purchases,
} from "@revenuecat/purchases-js";
import React, { useEffect, useRef } from "react";
import { usePurchasesLoaderData } from "../../util/PurchasesLoader";
import LogoutButton from "../../components/LogoutButton";
import { useNavigate } from "react-router-dom";

interface IPackageCardProps {
  pkg: Package;
  offering: Offering;
  purchases: Purchases;
}

const priceLabels: Record<string, string> = {
  P3M: "quarter",
  P6M: "6mo",
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

const formattedCombinedPeriod = (
  cycleCount: number,
  period?: number,
  unit?: string,
) => {
  if (!period || !unit) {
    return "";
  }
  const cyclesInIntroDuration = cycleCount * period;
  return `${cyclesInIntroDuration} ${unit}${cyclesInIntroDuration > 1 ? "s" : ""}`;
};

export const PackageCard: React.FC<IPackageCardProps> = ({
  pkg,
  offering,
  purchases,
}) => {
  const navigate = useNavigate();

  const applePayButtonref = useRef<HTMLDivElement>(null);

  if (!pkg.webBillingProduct) {
    return;
  }

  const originalPriceByProduct: Record<string, string> | null =
    (offering.metadata?.original_price_by_product as Record<string, string>) ??
    null;

  const price = pkg.webBillingProduct.price;
  const originalPrice = originalPriceByProduct
    ? originalPriceByProduct[pkg.webBillingProduct.identifier]
    : null;

  const trial = pkg.webBillingProduct.freeTrialPhase;
  const introPrice = pkg.webBillingProduct.introPricePhase;

  const renderTrialBadge = () => {
    if (!trial) return null;

    const trialLabel = trial.periodDuration
      ? trialLabels[trial.periodDuration] || trial.periodDuration
      : "";

    return <div className="freeTrial">{trialLabel} free trial</div>;
  };

  const renderIntroPricing = () => {
    if (!introPrice) return null;

    return (
      <div className="introPrice">
        <div className="currentPrice">
          {introPrice.price?.formattedPrice}
          {introPrice.periodDuration &&
            `/${priceLabels[introPrice.periodDuration]}`}
          <div className="futurePrice">
            for{" "}
            {formattedCombinedPeriod(
              introPrice.cycleCount,
              introPrice.period?.number,
              introPrice.period?.unit,
            )}
            , then {price?.formattedPrice}
            {pkg.webBillingProduct.period &&
              `/${
                priceLabels[pkg.webBillingProduct.normalPeriodDuration || ""] ||
                pkg.webBillingProduct.normalPeriodDuration
              }`}
          </div>
        </div>
      </div>
    );
  };

  const renderRegularPricing = () => {
    if (!price || introPrice) return null;

    const periodLabel = pkg.webBillingProduct.normalPeriodDuration
      ? priceLabels[pkg.webBillingProduct.normalPeriodDuration] ||
        pkg.webBillingProduct.normalPeriodDuration
      : "";

    return (
      <>
        {!trial && originalPrice && (
          <div className="previousPrice">{originalPrice}</div>
        )}

        <div className="currentPrice">
          <div>{price.formattedPrice}</div>
          {periodLabel && <div>/{periodLabel}</div>}
        </div>
      </>
    );
  };

  useEffect(() => {
    if (!applePayButtonref.current) return;
    if (applePayButtonref.current.children.length > 0) {
      console.log("Apple Pay button already rendered, skipping.");
      return;
    }
    if (!purchases) {
      return;
    }

    purchases
      .presentExpressPurchaseButton({
        rcPackage: pkg,
        htmlTarget: applePayButtonref.current,
      })
      .then((purchaseResult: PurchaseResult) => {
        const { customerInfo, redemptionInfo } = purchaseResult;
        console.log(`CustomerInfo after purchase: ${customerInfo}`);
        console.log(
          `RedemptionInfo after purchase: ${JSON.stringify(redemptionInfo)}`,
        );
        navigate(`/success/${purchases.getAppUserId()}`);
      });
  }, [applePayButtonref, purchases]);

  return (
    <div className="card">
      {renderTrialBadge()}
      {renderIntroPricing()}
      {renderRegularPricing()}

      <div className="productName">{pkg.webBillingProduct.displayName}</div>

      <div className="packageCTA" ref={applePayButtonref}></div>
    </div>
  );
};

const PaywallPage: React.FC = () => {
  const { purchases, offering } = usePurchasesLoaderData();

  if (!offering) {
    console.error("No offering found");
    return <>No offering found!</>;
  }
  const packages: Package[] = offering?.availablePackages || [];
  if (packages.length == 0) {
    console.error("No packages found in current offering.");
  }

  return (
    <>
      <LogoutButton />
      <div className="rc-paywall">
        <h1>
          Subscribe today and <em>save up to 25%!</em>
        </h1>
        <div className="packages">
          {packages.map((pkg) =>
            pkg.webBillingProduct !== null ? (
              <PackageCard
                key={pkg.identifier}
                pkg={pkg}
                offering={offering}
                purchases={purchases}
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
