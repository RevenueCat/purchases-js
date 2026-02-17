import type {
  Offering,
  Package,
  PurchaseResult,
  Purchases,
} from "@revenuecat/purchases-js";
import { ReservedCustomerAttribute } from "@revenuecat/purchases-js";
import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiKey, usePurchasesLoaderData } from "../../util/PurchasesLoader";
import LogoutButton from "../../components/LogoutButton";
import { Badge, PriceContainer } from "../paywall";

const isPaddleApiKey = (apiKey: string): boolean => {
  return /^pdl_[a-zA-Z0-9_.-]+$/.test(apiKey);
};

interface IPackageCardProps {
  pkg: Package;
  offering: Offering;
  purchases: Purchases;
}

export const PackageCard: React.FC<IPackageCardProps> = ({
  pkg,
  offering,
  purchases,
}) => {
  const purchaseButtonContainerRef = useRef<HTMLDivElement>(null);
  const hasPresentedRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (hasPresentedRef.current) return;
    hasPresentedRef.current = true;
    if (purchaseButtonContainerRef.current === null) return;
    if (purchaseButtonContainerRef.current.children.length > 0) return;

    purchases
      // @ts-expect-error This method is marked as internal for now but it's public.'
      .presentExpressPurchaseButton({
        rcPackage: pkg,
        purchaseOption: pkg.webBillingProduct.defaultPurchaseOption,
        htmlTarget: purchaseButtonContainerRef.current,
      })
      .then((purchaseResult: PurchaseResult) => {
        console.log(`Purchase result: ${JSON.stringify(purchaseResult)}`);
        navigate(`/success/${purchases.getAppUserId()}`);
      });
  }, []);

  return (
    <div className="card">
      <Badge webBillingProduct={pkg.webBillingProduct} />
      <div className="cardContent">
        <PriceContainer
          webBillingProduct={pkg.webBillingProduct}
          offering={offering}
        />

        <div>
          <div className="productName">{pkg.webBillingProduct.title}</div>

          <div className="packageCTA">
            <div ref={purchaseButtonContainerRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ExpressPurchaseButtonsPackageSelector: React.FC = () => {
  const { purchases, offering } = usePurchasesLoaderData();
  const [searchParams] = useSearchParams();
  const displayName = searchParams.get("$displayName");
  const nickname = searchParams.get("nickname");
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
            marginBottom: "16px",
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

export default ExpressPurchaseButtonsPackageSelector;
