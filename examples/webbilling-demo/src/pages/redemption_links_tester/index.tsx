import type { PurchaseResult } from "@revenuecat/purchases-js";
import { Purchases } from "@revenuecat/purchases-js";
import React, { useCallback, useEffect, useRef } from "react";
import { usePurchasesLoaderData } from "../../util/PurchasesLoader";
import { useNavigate, useSearchParams } from "react-router-dom";

const apiKey = window.__RC_API_KEY__ || import.meta.env.VITE_RC_API_KEY;
const canary = import.meta.env.VITE_RC_CANARY;

const RedemptionLinksTester: React.FC = () => {
  const { offering } = usePurchasesLoaderData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lang = searchParams.get("lang");
  const [purchaseResult, setPurchaseResult] =
    React.useState<PurchaseResult | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const anonymousInputRef = useRef<HTMLInputElement>(null);
  const identifiedInputRef = useRef<HTMLInputElement>(null);
  const anonymousId = Purchases.generateRevenueCatAnonymousAppUserId();
  const [redemptionResult, setRedemptionResult] = React.useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!offering || !ref.current) {
      return;
    }

    const purchases = Purchases.getSharedInstance();

    purchases
      .presentPaywall({
        offering: offering,
        htmlTarget: ref.current,
        selectedLocale: lang || undefined,
      })
      .then((purchaseResult: PurchaseResult) => {
        setPurchaseResult(purchaseResult);
      })
      .catch((err: Error) => console.log(`Error: ${err}`));
  }, [offering, navigate, lang]);

  const redeem = useCallback(
    async (appUserId: string, redemptionLink: string) => {
      const token = redemptionLink?.split("?redemption_token=")[1];

      return await fetch(
        `https://api.revenuecat.com/v1/subscribers/${appUserId}/redeem_web_purchase`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "X-RC-Canary": canary,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            redemption_token: token,
          }),
        },
      )
        .then((res) => res.json())
        .then((data) => setRedemptionResult(JSON.stringify(data)))
        .catch((err) => setRedemptionResult(err.message));
    },
    [setRedemptionResult, ref],
  );

  if (!offering) {
    console.error("No offering found");
    return <>No offering found!</>;
  }

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
      }}
    >
      <div style={{ height: "100%", width: "30vw" }} ref={ref}></div>
      <div
        style={{
          height: "100%",
          width: "70vw",
          padding: "50px",
          overflow: "scroll",
        }}
      >
        <h1>Redemption Links Tester</h1>
        {purchaseResult ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              alignItems: "flex-start",
              justifyContent: "flex-start",
            }}
          >
            <div style={{ width: "100%" }}>
              <h2>Redemption Link</h2>
              <p>{purchaseResult?.redemptionInfo?.redeemUrl}</p>
            </div>

            <div>
              <h2>Web Purchase Owner</h2>
              <p>
                app user id: {purchaseResult.customerInfo.originalAppUserId}
              </p>
            </div>

            <div style={{ width: "100%" }}>
              <h2>Redeem</h2>
              <h3>With Anonymous ID (Alias behaviour)</h3>
              <input
                value={anonymousId}
                ref={anonymousInputRef}
                type="text"
                placeholder="Anonymous ID"
                style={{ width: "400px", marginRight: "20px" }}
              />
              <button
                onClick={() => {
                  if (
                    !anonymousInputRef.current ||
                    !purchaseResult?.redemptionInfo?.redeemUrl
                  ) {
                    return;
                  }

                  redeem(
                    anonymousInputRef.current.value,
                    purchaseResult?.redemptionInfo?.redeemUrl,
                  );
                }}
              >
                Redeem
              </button>

              <h3>With Indentified ID (Purchase Transfer behaviour)</h3>
              <input
                ref={identifiedInputRef}
                type="text"
                placeholder="Identified ID"
                style={{ width: "400px", marginRight: "20px" }}
              />
              <button
                onClick={() => {
                  if (
                    !identifiedInputRef.current ||
                    !purchaseResult?.redemptionInfo?.redeemUrl
                  ) {
                    return;
                  }

                  redeem(
                    identifiedInputRef.current.value,
                    purchaseResult?.redemptionInfo?.redeemUrl,
                  );
                }}
              >
                Redeem
              </button>
            </div>
            <div>
              {redemptionResult && (
                <>
                  <h2>Redemption Result</h2>
                  <p>{redemptionResult}</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <>No purchase result yet</>
        )}
      </div>
    </div>
  );
};

export default RedemptionLinksTester;
