import type { Package } from "@revenuecat/purchases-js/pure";
import { PurchasesError } from "@revenuecat/purchases-js/pure";
import React from "react";
import { useNavigate } from "react-router-dom";
import { usePurchasesPureLoaderData } from "../../util/PurchasesLoaderPure";
import Button from "../../components/Button";
import LogoutButton from "../../components/LogoutButton";

const PurePage: React.FC = () => {
  const navigate = useNavigate();
  const { purchases, offering } = usePurchasesPureLoaderData();

  if (!offering) {
    console.error("No offering found");
    return <>No offering found!</>;
  }
  const packages: Package[] = offering?.availablePackages || [];

  const onPackageCardClicked = async (pkg: Package) => {
    if (!pkg.webBillingProduct) return;
    const option = pkg.webBillingProduct.defaultSubscriptionOption;
    try {
      const { customerInfo } = await purchases.purchase({
        rcPackage: pkg,
        purchaseOption: option,
        selectedLocale: navigator.language,
      });
      console.log(
        `CustomerInfo after purchase: ${JSON.stringify(customerInfo)}`,
      );
      navigate(`/success/${purchases.getAppUserId()}`);
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
          Pure entrypoint demo
        </div>

        <h1>Pure entrypoint test</h1>
        <p style={{ maxWidth: "600px" }}>
          This page imports the SDK from{" "}
          <code>@revenuecat/purchases-js/pure</code>. Open DevTools → Network
          and filter by <code>js.stripe.com</code>. Stripe.js should{" "}
          <strong>not</strong> load until you click a package below to start a
          purchase.
        </p>

        <div className="packages">
          {packages.map((pkg) =>
            pkg.webBillingProduct !== null ? (
              <div
                key={pkg.identifier}
                role="button"
                className="card"
                onClick={() => onPackageCardClicked(pkg)}
              >
                <div className="cardContent">
                  <div>
                    <div className="productName">
                      {pkg.webBillingProduct.title}
                    </div>
                    <div className="packageCTA">
                      <Button caption="Choose plan" />
                    </div>
                  </div>
                </div>
              </div>
            ) : null,
          )}
        </div>
        <div className="notice">Demo only. No payment will be processed.</div>
      </div>
    </>
  );
};

export default PurePage;
