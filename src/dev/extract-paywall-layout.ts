import { mount, unmount } from "svelte";
import { Paywall } from "@revenuecat/purchases-ui-js";
import type {
  ExtractInput,
  ExtractedLayout,
  ComponentLayout,
} from "./extract-types";
import { EXTRACTOR_VERSION } from "./extract-types";
import { buildPaywallMountProps } from "../helpers/paywall-mount-props";
import { getDocument, getNullableWindow } from "../helpers/browser-globals";
import { synthesizeOffering } from "./synthesize-offering";
import { walkPaywallTree } from "./paywall-tree-walker";
import { readComponentLayout } from "./dom-layout-reader";

const noop = () => {};

export async function extractPaywallLayout(
  input: ExtractInput,
): Promise<ExtractedLayout> {
  const {
    paywallData,
    uiConfig,
    viewport,
    locale,
    darkMode = false,
    customVariables,
    offering,
  } = input;
  const scale = viewport.scale ?? 1;

  const doc = getDocument();
  const container = doc.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = `${viewport.width}px`;
  container.style.height = `${viewport.height}px`;
  container.style.transformOrigin = "top left";
  container.style.transform = `scale(${scale})`;
  container.style.overflow = "hidden";
  container.style.zIndex = "2147483647";
  container.setAttribute("data-rc-extractor-root", "true");
  if (darkMode) {
    container.style.colorScheme = "dark";
    container.classList.add("rc-extractor-dark");
  }
  doc.body.appendChild(container);

  const restoreMatchMedia = forceColorScheme(darkMode);

  // Synthesize an offering when the caller didn't supply a real one.
  // Keep the real offering's identifier out of metadata in that case.
  const isReal = offering != null;
  const offeringToUse = isReal
    ? offering
    : synthesizeOffering(paywallData, uiConfig);

  const mountProps = buildPaywallMountProps({
    offering: offeringToUse,
    selectedLocale: locale,
    hideBackButtons: false,
    customVariables,
  });

  let component: ReturnType<typeof mount> | null = null;

  try {
    component = mount(Paywall, {
      target: container,
      props: {
        ...mountProps,
        appUserId: "__extract__",
        onNavigateToUrlClicked: noop,
        onCompleteWorkflowNavigate: noop,
        onVisitCustomerCenterClicked: noop,
        onBackClicked: noop,
        onRestorePurchasesClicked: noop,
        onPurchaseClicked: noop,
        onError: noop,
        walletButtonRender: undefined,
        onComponentInteraction: noop,
      } as never,
    });

    await waitForLayout();

    const containerRect = container.getBoundingClientRect();
    const components: Record<string, ComponentLayout> = {};
    for (const entry of walkPaywallTree(paywallData)) {
      components[entry.id] = readComponentLayout({ entry, container });
    }

    const metadata: ExtractedLayout["metadata"] = {
      platform: "web",
      platformVersion: getNullableWindow()?.navigator.userAgent ?? "unknown",
      extractorVersion: EXTRACTOR_VERSION,
      offeringId: isReal ? offering.identifier : null,
      locale: mountProps.selectedLocale,
      timestamp: new Date().toISOString(),
      viewport: { width: viewport.width, height: viewport.height, scale },
      rootFrame: {
        x: 0,
        y: 0,
        width: Math.round(containerRect.width),
        height: Math.round(containerRect.height),
      },
    };

    return { metadata, components };
  } finally {
    try {
      if (component) unmount(component);
    } catch {
      // Ignore unmount errors — best-effort cleanup.
    }
    container.remove();
    restoreMatchMedia();
  }
}

async function waitForLayout(): Promise<void> {
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  await new Promise<void>((r) => queueMicrotask(() => r()));
}

function forceColorScheme(darkMode: boolean): () => void {
  const win = getNullableWindow();
  if (win == null || typeof win.matchMedia !== "function") {
    return () => {};
  }
  const original = win.matchMedia.bind(win);
  win.matchMedia = ((query: string): MediaQueryList => {
    if (query === "(prefers-color-scheme: dark)") {
      return {
        matches: darkMode,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      } as MediaQueryList;
    }
    return original(query);
  }) as typeof win.matchMedia;
  return () => {
    win.matchMedia = original;
  };
}
