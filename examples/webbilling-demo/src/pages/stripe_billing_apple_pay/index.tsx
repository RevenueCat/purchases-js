import type {
  Package,
  PurchaseResult,
  QuickPurchasePreparationResult,
} from "@revenuecat/purchases-js";
import { PurchasesError } from "@revenuecat/purchases-js";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import LogoutButton from "../../components/LogoutButton";
import { usePurchasesLoaderData } from "../../util/PurchasesLoader";
import { Badge, PriceContainer } from "../paywall";

type PreparationState =
  | "preparing"
  | "apple_pay_available"
  | "normal_checkout"
  | "error";

const StripeBillingApplePayPage: React.FC = () => {
  const { purchases, offering } = usePurchasesLoaderData();
  const [searchParams] = useSearchParams();
  const packages = useMemo(() => offering?.availablePackages ?? [], [offering]);
  const [selectedPackageId, setSelectedPackageId] = useState(
    packages[0]?.identifier ?? "",
  );
  const [preparationState, setPreparationState] =
    useState<PreparationState>("preparing");
  const [preparationAttempt, setPreparationAttempt] = useState(0);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedPackage = packages.find(
    (pkg) => pkg.identifier === selectedPackageId,
  );
  const selectedLocale = searchParams.get("lang") ?? navigator.language;
  const customerEmail = searchParams.get("email") ?? undefined;

  useEffect(() => {
    if (!selectedPackage) {
      return;
    }

    let active = true;
    setPreparationState("preparing");
    setMessage(null);
    purchases
      .prepareForQuickPurchases({
        rcPackage: selectedPackage,
        selectedLocale,
        customerEmail,
      })
      .then((result: QuickPurchasePreparationResult) => {
        if (!active) {
          return;
        }
        setPreparationState(
          result.applePayAvailable ? "apple_pay_available" : "normal_checkout",
        );
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        setPreparationState("error");
        setMessage(
          `Preparation failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      });

    return () => {
      active = false;
    };
  }, [
    customerEmail,
    preparationAttempt,
    purchases,
    selectedLocale,
    selectedPackage,
  ]);

  if (!offering || !selectedPackage) {
    return <>No offering or package found.</>;
  }

  const purchase = async () => {
    setIsPurchasing(true);
    setMessage(null);
    try {
      const result: PurchaseResult = await purchases.purchase({
        rcPackage: selectedPackage,
        selectedLocale,
        customerEmail,
        tryWithApplePay: true,
      });
      setMessage(
        `Purchase succeeded. Operation: ${result.operationSessionId}; transaction: ${result.storeTransaction.storeTransactionId}`,
      );
    } catch (error) {
      const description =
        error instanceof PurchasesError
          ? `${error.errorCode}: ${error.message}`
          : error instanceof Error
            ? error.message
            : String(error);
      setMessage(`Purchase ended: ${description}`);
    } finally {
      setIsPurchasing(false);
      setPreparationAttempt((attempt) => attempt + 1);
    }
  };

  const preparationLabel = {
    preparing: "Preparing Apple Pay…",
    apple_pay_available: "Apple Pay is ready",
    normal_checkout: "Apple Pay unavailable; button will open Stripe Checkout",
    error: "Preparation failed; button will open Stripe Checkout",
  }[preparationState];

  return (
    <>
      <LogoutButton />
      <div className="rc-paywall">
        <div className="payment-method-badge">
          Stripe Billing Apple Pay demo
        </div>
        <h1>Choose a package</h1>
        <div className="packages">
          {packages.map((pkg: Package) => (
            <button
              className="card"
              key={pkg.identifier}
              onClick={() => setSelectedPackageId(pkg.identifier)}
              type="button"
              aria-pressed={pkg.identifier === selectedPackageId}
            >
              <Badge webBillingProduct={pkg.webBillingProduct} />
              <div className="cardContent">
                <PriceContainer
                  webBillingProduct={pkg.webBillingProduct}
                  offering={offering}
                />
                <div className="productName">{pkg.webBillingProduct.title}</div>
              </div>
            </button>
          ))}
        </div>
        <p>{preparationLabel}</p>
        <button
          className="button"
          disabled={preparationState === "preparing" || isPurchasing}
          onClick={() => void purchase()}
          type="button"
        >
          {isPurchasing ? "Purchasing…" : "Purchase"}
        </button>
        {message ? <p>{message}</p> : null}
        <p className="notice">
          This page uses a normal React button and never renders RevenueCat's
          Express Purchase Button.
        </p>
      </div>
    </>
  );
};

export default StripeBillingApplePayPage;
