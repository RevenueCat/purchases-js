import type { Offering, Package } from "@revenuecat/purchases-js";
import { PurchasesError } from "@revenuecat/purchases-js";
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

const PaywallPage: React.FC = () => {
  const navigate = useNavigate();
  const { purchases, offering } = usePurchasesLoaderData();
  const [searchParams] = useSearchParams();
  const lang = searchParams.get("lang");
  if (!offering) {
    console.error("No offering found");
    return <>No offering found!</>;
  }
  const packages: Package[] = offering?.availablePackages || [];
  if (packages.length == 0) {
    console.error("No packages found in current offering.");
  }

  const onPackageCardClicked = async (pkg: Package) => {
    if (!pkg.rcBillingProduct) {
      return;
    }

    const option = pkg.rcBillingProduct.defaultSubscriptionOption;
    console.log(`Purchasing with option ${option?.id}`);

    // How do we complete the purchase?
    try {
      const { customerInfo, redemptionInfo } = await purchases.purchase({
        rcPackage: pkg,
        purchaseOption: option,
        selectedLocale: lang || navigator.language,
      });

      console.log(`CustomerInfo after purchase: ${customerInfo}`);
      console.log(
        `RedemptionInfo after purchase: ${JSON.stringify(redemptionInfo)}`,
      );

      let queryParamRedemptionInfoUrl = "";
      if (redemptionInfo && redemptionInfo.redeemUrl) {
        queryParamRedemptionInfoUrl = `?redeem_url=${redemptionInfo.redeemUrl}`;
      }

      navigate(
        `/success/${purchases.getAppUserId()}${queryParamRedemptionInfoUrl}`,
      );
    } catch (e) {
      if (e instanceof PurchasesError) {
        console.log(`Error performing purchase: ${e}`);
      } else {
        console.error(`Unknown error: ${e}`);
      }
    }
  };

  return (
    <>
      <LogoutButton />
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
                offering={offering}
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
