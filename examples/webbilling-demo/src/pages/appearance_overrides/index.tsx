import type { Package } from "@revenuecat/purchases-js";
import { useState } from "react";
import LogoutButton from "../../components/LogoutButton";
import { usePurchasesLoaderData } from "../../util/PurchasesLoader";
import {
  configuredAppearanceOverride,
  operationAppearanceOverride,
} from "../../util/runtime-appearance-overrides";

type DemoStatus = {
  kind: "idle" | "running" | "success" | "error";
  message: string;
};

type AppearanceMode = "default" | "configured" | "operation";

const purchaseLabels: Record<AppearanceMode, string> = {
  default: "checkout without a runtime override",
  configured: "configure-time checkout",
  operation: "per-purchase checkout",
};

const paywallLabels: Record<AppearanceMode, string> = {
  default: "paywall without a runtime override",
  configured: "configure-time paywall",
  operation: "presentPaywall-time paywall",
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const AppearanceOverridesPage = () => {
  const { purchases, defaultPurchases, offering } = usePurchasesLoaderData();
  const packages =
    offering?.availablePackages.filter((pkg) => pkg.webBillingProduct) ?? [];
  const [selectedPackageId, setSelectedPackageId] = useState(
    packages[0]?.identifier ?? "",
  );
  const [status, setStatus] = useState<DemoStatus>({
    kind: "idle",
    message: "Choose a flow to open checkout.",
  });

  const selectedPackage = packages.find(
    (pkg) => pkg.identifier === selectedPackageId,
  );
  const isRunning = status.kind === "running";

  const runFlow = async (label: string, operation: () => Promise<unknown>) => {
    setStatus({ kind: "running", message: `Opening ${label}…` });

    try {
      await operation();
      setStatus({ kind: "success", message: `${label} completed.` });
    } catch (error) {
      setStatus({
        kind: "error",
        message: `${label} closed or failed: ${getErrorMessage(error)}`,
      });
    }
  };

  const purchase = (pkg: Package, appearanceMode: AppearanceMode) => {
    const purchaseInstance =
      appearanceMode === "default" ? defaultPurchases : purchases;

    return runFlow(purchaseLabels[appearanceMode], () =>
      purchaseInstance.purchase({
        rcPackage: pkg,
        ...(appearanceMode === "operation"
          ? { brandingAppearanceOverride: operationAppearanceOverride }
          : {}),
      }),
    );
  };

  const presentPaywall = (appearanceMode: AppearanceMode) => {
    if (!offering) return Promise.resolve();

    const purchaseInstance =
      appearanceMode === "default" ? defaultPurchases : purchases;

    return runFlow(paywallLabels[appearanceMode], () =>
      purchaseInstance.presentPaywall({
        offering,
        ...(appearanceMode === "operation"
          ? { brandingAppearanceOverride: operationAppearanceOverride }
          : {}),
      }),
    );
  };

  if (!offering || !packages.length || !selectedPackage) {
    return (
      <main className="appearance-demo appearance-demo--empty">
        <LogoutButton />
        <h1>Runtime appearance overrides</h1>
        <p>
          This page needs an offering with at least one purchasable package.
        </p>
      </main>
    );
  }

  return (
    <main className="appearance-demo">
      <LogoutButton />

      <header className="appearance-demo__header">
        <span className="appearance-demo__eyebrow">WEB-4597 demo</span>
        <h1>Runtime appearance overrides</h1>
        <p>
          Compare the Dashboard/default appearance with colors stored when
          Purchases is configured and colors passed only to one purchase or
          paywall presentation. Operation colors should win when both are
          present.
        </p>
      </header>

      <section className="appearance-demo__palettes" aria-label="Demo palettes">
        <article className="appearance-demo__palette-card">
          <div className="appearance-demo__swatches" aria-hidden="true">
            <span
              style={{
                backgroundColor:
                  configuredAppearanceOverride.color_buttons_primary,
              }}
            />
            <span
              style={{
                backgroundColor:
                  configuredAppearanceOverride.color_product_info_bg,
              }}
            />
            <span
              style={{
                backgroundColor: configuredAppearanceOverride.color_page_bg,
              }}
            />
          </div>
          <h2>Configure-time palette</h2>
          <p>Purple buttons, a lavender product panel, and rounded shapes.</p>
        </article>

        <article className="appearance-demo__palette-card">
          <div className="appearance-demo__swatches" aria-hidden="true">
            <span
              style={{
                backgroundColor:
                  operationAppearanceOverride.color_buttons_primary,
              }}
            />
            <span
              style={{
                backgroundColor:
                  operationAppearanceOverride.color_product_info_bg,
              }}
            />
            <span
              style={{
                backgroundColor: operationAppearanceOverride.color_accent,
              }}
            />
          </div>
          <h2>Operation palette</h2>
          <p>Green buttons, a peach product panel, and pill shapes.</p>
        </article>
      </section>

      <section className="appearance-demo__controls">
        <label htmlFor="appearance-demo-package">Package</label>
        <select
          id="appearance-demo-package"
          className="compact-input"
          value={selectedPackageId}
          onChange={(event) => setSelectedPackageId(event.target.value)}
        >
          {packages.map((pkg) => (
            <option key={pkg.identifier} value={pkg.identifier}>
              {pkg.webBillingProduct?.title ?? pkg.identifier}
            </option>
          ))}
        </select>

        <div className="appearance-demo__flow-grid">
          <article className="appearance-demo__flow-card">
            <h2>Direct purchase</h2>
            <p>Calls purchases.purchase() for the selected package.</p>
            <button
              className="compact-button compact-button--secondary"
              disabled={isRunning}
              onClick={() => purchase(selectedPackage, "default")}
            >
              No runtime override
            </button>
            <button
              className="compact-button compact-button--secondary"
              disabled={isRunning}
              onClick={() => purchase(selectedPackage, "configured")}
            >
              Use configure-time colors
            </button>
            <button
              className="compact-button compact-button--primary"
              disabled={isRunning}
              onClick={() => purchase(selectedPackage, "operation")}
            >
              Override this purchase
            </button>
          </article>

          <article className="appearance-demo__flow-card">
            <h2>RevenueCat Paywall</h2>
            <p>Calls purchases.presentPaywall() for the current offering.</p>
            <button
              className="compact-button compact-button--secondary"
              disabled={isRunning}
              onClick={() => presentPaywall("default")}
            >
              No runtime override
            </button>
            <button
              className="compact-button compact-button--secondary"
              disabled={isRunning}
              onClick={() => presentPaywall("configured")}
            >
              Use configure-time colors
            </button>
            <button
              className="compact-button compact-button--primary"
              disabled={isRunning}
              onClick={() => presentPaywall("operation")}
            >
              Override this paywall
            </button>
          </article>
        </div>

        <p
          className={`appearance-demo__status appearance-demo__status--${status.kind}`}
          role="status"
        >
          {status.message}
        </p>
      </section>
    </main>
  );
};

export default AppearanceOverridesPage;
