import { describe, expect, test } from "vitest";
import { toExpressPurchaseOptions } from "../../../ui/express-purchase-button/stripe-helpers";
import { Translator } from "../../../ui/localization/translator";
import { rcPackage } from "../../../stories/fixtures";

describe("toExpressPurchaseOptions", () => {
  const translator = new Translator();
  const purchaseOption = rcPackage.webBillingProduct.defaultPurchaseOption;
  const managementUrl = "https://example.com/manage/subscriptions/123";

  test("sets the business name when an app name is provided", () => {
    const result = toExpressPurchaseOptions(
      rcPackage,
      purchaseOption,
      managementUrl,
      translator,
      "Test App",
    );

    expect(result.business).toStrictEqual({ name: "Test App" });
  });

  test("does not set the business name when an app name is not provided", () => {
    const result = toExpressPurchaseOptions(
      rcPackage,
      purchaseOption,
      managementUrl,
      translator,
      null,
    );

    expect(result.business).toBeUndefined();
  });
});
