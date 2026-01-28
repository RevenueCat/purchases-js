import type { Offering, Package } from "@revenuecat/purchases-js";
import {
  PurchasesError,
  ReservedCustomerAttribute,
  type PricingPhase,
} from "@revenuecat/purchases-js";
import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePurchasesLoaderData, apiKey } from "../../util/PurchasesLoader";
import Button from "../../components/Button";
import LogoutButton from "../../components/LogoutButton";

const isPaddleApiKey = (apiKey: string): boolean => {
  return /^pdl_[a-zA-Z0-9_.-]+$/.test(apiKey);
};

interface IPackageCardProps {
  pkg: Package;
  offering: Offering;
  onClick: () => void;
}

const priceLabels: Record<string, string> = {
  P1D: "day",
  P3D: "3d",
  P7D: "7d",
  P1W: "1w",
  P2W: "2w",
  P3W: "3w",
  P4W: "4w",
  P6W: "6w",
  P8W: "8w",
  P10W: "10w",
  P12W: "12w",
  P1M: "mo",
  P2M: "2mo",
  P3M: "quarter",
  P6M: "6mo",
  P8M: "8mo",
  P9M: "9mo",
  P10M: "10mo",
  P12M: "12m",
  P1Y: "yr",
  PT1H: "hr",
};

const getPriceLabel = (periodDuration?: string | null) => {
  const label = periodDuration ? priceLabels[periodDuration] : undefined;
  return label ?? periodDuration ?? "";
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

const getTrialPriceLabel = (periodDuration?: string | null) => {
  const label = periodDuration ? trialLabels[periodDuration] : undefined;
  return label ?? periodDuration ?? "";
};

const isPermanentPromotionalPrice = (promotionalPrice: PricingPhase | null) => {
  return promotionalPrice && promotionalPrice.periodDuration === null;
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
  onClick,
}) => {
  const originalPriceByProduct: Record<string, string> | null =
    (offering.metadata?.original_price_by_product as Record<string, string>) ??
    null;

  const price = pkg.webBillingProduct.price;
  const originalPrice = originalPriceByProduct
    ? originalPriceByProduct[pkg.webBillingProduct.identifier]
    : null;

  const trial = pkg.webBillingProduct.freeTrialPhase;
  const discountPrice = pkg.webBillingProduct.discountPricePhase;
  const introPrice = pkg.webBillingProduct.introPricePhase;
  const promotionalPrice = discountPrice ?? introPrice;

  const isSubscription = pkg.webBillingProduct.productType === "subscription";

  const renderBadge = () => {
    if (discountPrice) {
      const isPermanentDiscount = isPermanentPromotionalPrice(discountPrice);
      return (
        <div className="freeTrial">
          {isPermanentDiscount
            ? "Lifetime"
            : getTrialPriceLabel(discountPrice.periodDuration)}{" "}
          Discount
        </div>
      );
    }

    if (trial) {
      return (
        <div className="freeTrial">
          {getTrialPriceLabel(trial.periodDuration)} free trial
        </div>
      );
    }

    return null;
  };

  const renderPromotionalPricing = () => {
    if (!promotionalPrice) return null;

    const webBillingProductPriceLabel = getPriceLabel(
      pkg.webBillingProduct.normalPeriodDuration,
    );
    if (isPermanentPromotionalPrice(promotionalPrice) || !isSubscription) {
      return (
        <div className="introPrice">
          <div className="currentPrice">
            {promotionalPrice.price?.formattedPrice}
            {webBillingProductPriceLabel && `/${webBillingProductPriceLabel}`}
            <div className="futurePrice">
              Discounted from {price?.formattedPrice}
              {webBillingProductPriceLabel && `/${webBillingProductPriceLabel}`}
            </div>
          </div>
        </div>
      );
    } else {
      const periodLabel = getPriceLabel(promotionalPrice?.periodDuration);

      return (
        <div className="introPrice">
          <div className="currentPrice">
            {promotionalPrice?.price?.formattedPrice}
            {periodLabel && `/${periodLabel}`}

            <div className="futurePrice">
              for{" "}
              {formattedCombinedPeriod(
                promotionalPrice.cycleCount,
                promotionalPrice.period?.number,
                promotionalPrice.period?.unit,
              )}
              , then {price?.formattedPrice}
              {pkg.webBillingProduct.period &&
                `/${webBillingProductPriceLabel}`}
            </div>
          </div>
        </div>
      );
    }
  };

  const renderRegularPricing = () => {
    if (!price || promotionalPrice) return null;

    const periodLabel = getPriceLabel(
      pkg.webBillingProduct.normalPeriodDuration,
    );

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

  return (
    <div role="button" className="card" onClick={onClick}>
      {renderBadge()}
      {renderPromotionalPricing()}
      {renderRegularPricing()}

      <div className="productName">{pkg.webBillingProduct.displayName}</div>

      <div className="packageCTA">
        <Button caption={trial ? "Start Free Trial" : "Choose plan"} />
      </div>
    </div>
  );
};

const PaywallPage: React.FC = () => {
  const navigate = useNavigate();
  const { purchases, offering } = usePurchasesLoaderData();
  const [searchParams] = useSearchParams();
  const lang = searchParams.get("lang");
  const email = searchParams.get("email");
  const displayName = searchParams.get("$displayName");
  const nickname = searchParams.get("nickname");
  const skipSuccessPage = searchParams.get("skipSuccessPage") === "true";
  const attributesSetRef = useRef(false);

  useEffect(() => {
    const setAttributes = async () => {
      if (attributesSetRef.current) return;

      const attributes: { [key: string]: string } = {};
      if (displayName) {
        attributes[ReservedCustomerAttribute.DisplayName] = displayName;
      }
      if (nickname) {
        attributes["nickname"] = nickname;
      }

      if (Object.keys(attributes).length > 0) {
        try {
          attributesSetRef.current = true;
          await purchases.setAttributes(attributes);
        } catch (error) {
          attributesSetRef.current = false;
          console.error("Error setting attributes:", error);
        }
      }
    };

    setAttributes();
  }, [purchases, displayName, nickname]);

  if (!offering) {
    console.error("No offering found");
    return <>No offering found!</>;
  }
  const packages: Package[] = offering?.availablePackages || [];
  if (packages.length == 0) {
    console.error("No packages found in current offering.");
  }

  const onPackageCardClicked = async (pkg: Package) => {
    if (!pkg.webBillingProduct) {
      return;
    }

    const option = pkg.webBillingProduct.defaultSubscriptionOption;
    console.log(`Purchasing with option ${option?.id}`);

    // Note: Can also easily check for trial/intro pricing using convenience accessors
    if (pkg.webBillingProduct.freeTrialPhase) {
      console.log(
        `Package has free trial: ${pkg.webBillingProduct.freeTrialPhase.periodDuration}`,
      );
    }
    if (pkg.webBillingProduct.introPricePhase) {
      console.log(
        `Package has intro pricing: ${pkg.webBillingProduct.introPricePhase.price?.formattedPrice}`,
      );
    }

    // How do we complete the purchase?
    try {
      const { customerInfo, redemptionInfo, storeTransaction } =
        await purchases.purchase({
          rcPackage: pkg,
          purchaseOption: option,
          selectedLocale: lang || navigator.language,
          customerEmail: email || undefined,
          skipSuccessPage: skipSuccessPage,
          // @ts-expect-error This method is marked as internal for now but it's public.'
          labelsOverride: {
            en: {
              "payment_entry_page.button_start_trial":
                "Start {{trialPeriodLabel}} free",
            },
          },
        });

      console.log(`StoreTransaction: ${JSON.stringify(storeTransaction)}`);
      console.log(
        `CustomerInfo after purchase: ${JSON.stringify(customerInfo)}`,
      );
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
      <div className="rc-paywall">
        <div
          className="payment-method-badge"
          style={{
            backgroundColor: "#f7f8f9",
            padding: "8px 16px",
            borderRadius: "4px",
            display: "inline-block",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          {isPaddleApiKey(apiKey) ? "Paddle demo" : "Web Billing demo"}
        </div>

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
