import type { AppStateStatus } from "react-native";
import { ErrorCode, PurchasesError } from "../entities/errors";

/** A subscription returned by React Native's AppState listener. */
export interface AppStateSubscription {
  remove(): void;
}

/** The small portion of React Native AppState used by the Amazon BillingWrapper. */
export interface ReactNativeAppState {
  currentState: AppStateStatus | null;
  addEventListener(
    type: "change",
    listener: (nextState: AppStateStatus) => void,
  ): AppStateSubscription;
}

export type ReactNativeAppStateLoader = () => Promise<ReactNativeAppState>;

const missingReactNativeAppStateLoader: ReactNativeAppStateLoader =
  async () => {
    throw new PurchasesError(
      ErrorCode.ConfigurationError,
      "React Native AppState is supported only by the @revenuecat/purchases-js/vega entry point.",
    );
  };

let reactNativeAppStateLoader: ReactNativeAppStateLoader =
  missingReactNativeAppStateLoader;

/** Installs the Vega runtime's React Native AppState implementation. */
export function setReactNativeAppStateLoader(
  loader: ReactNativeAppStateLoader,
): void {
  reactNativeAppStateLoader = loader;
}

/** Restores the default loader. Primarily useful for tests. */
export function resetReactNativeAppStateLoader(): void {
  reactNativeAppStateLoader = missingReactNativeAppStateLoader;
}

/** Gets React Native AppState through the implementation selected by the entry point. */
export function loadReactNativeAppState(): Promise<ReactNativeAppState> {
  return reactNativeAppStateLoader();
}
