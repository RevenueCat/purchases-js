import { describe, expect, test } from "vitest";
import { parseOfferingIntoVariables } from "../../helpers/variables-helpers";
import { Offering, SubscriptionOption } from "../../entities/offerings";

const offering = {
  identifier: "MultiCurrencyTest",
  serverDescription: "Multi currency test Nicola",
  metadata: null,
  packagesById: {
    $rc_monthly: {
      identifier: "$rc_monthly",
      rcBillingProduct: {
        identifier: "test_multicurrency_all_currencies",
        displayName: "Mario",
        title: "Mario",
        description:
          "Just the best for Italian supercalifragilisticexpialidocious plumbers, groom them on a monthly basis",
        productType: "subscription",
        currentPrice: {
          amount: 900,
          amountMicros: 9000000,
          currency: "EUR",
          formattedPrice: "€9.00",
        },
        normalPeriodDuration: "P1M",
        presentedOfferingIdentifier: "MultiCurrencyTest",
        presentedOfferingContext: {
          offeringIdentifier: "MultiCurrencyTest",
          targetingContext: null,
          placementIdentifier: null,
        },
        defaultPurchaseOption: {
          id: "base_option",
          priceId: "prcb358d16d7b7744bb8ab0",
          base: {
            periodDuration: "P1M",
            period: {
              number: 1,
              unit: "month",
            },
            cycleCount: 1,
            price: {
              amount: 900,
              amountMicros: 9000000,
              currency: "EUR",
              formattedPrice: "€9.00",
            },
          },
          trial: null,
        },
        defaultSubscriptionOption: {
          id: "base_option",
          priceId: "prcb358d16d7b7744bb8ab0",
          base: {
            periodDuration: "P1M",
            period: {
              number: 1,
              unit: "month",
            },
            cycleCount: 1,
            price: {
              amount: 900,
              amountMicros: 9000000,
              currency: "EUR",
              formattedPrice: "€9.00",
            },
          },
          trial: null,
        },
        subscriptionOptions: {
          base_option: {
            id: "base_option",
            priceId: "prcb358d16d7b7744bb8ab0",
            base: {
              periodDuration: "P1M",
              period: {
                number: 1,
                unit: "month",
              },
              cycleCount: 1,
              price: {
                amount: 900,
                amountMicros: 9000000,
                currency: "EUR",
                formattedPrice: "€9.00",
              },
            },
            trial: null,
          },
        },
        defaultNonSubscriptionOption: null,
      },
      packageType: "$rc_monthly",
    },
    $rc_weekly: {
      identifier: "$rc_weekly",
      rcBillingProduct: {
        identifier: "luigis_weekly",
        displayName: "Luigi Special",
        title: "Luigi Special",
        description:
          "A fresh alternative to the Mario's, clean them up every week",
        productType: "subscription",
        currentPrice: {
          amount: 900,
          amountMicros: 9000000,
          currency: "EUR",
          formattedPrice: "€9.00",
        },
        normalPeriodDuration: "P1W",
        presentedOfferingIdentifier: "MultiCurrencyTest",
        presentedOfferingContext: {
          offeringIdentifier: "MultiCurrencyTest",
          targetingContext: null,
          placementIdentifier: null,
        },
        defaultPurchaseOption: {
          id: "base_option",
          priceId: "prca9ad8d30922442b58e05",
          base: {
            periodDuration: "P1W",
            period: {
              number: 1,
              unit: "week",
            },
            cycleCount: 1,
            price: {
              amount: 900,
              amountMicros: 9000000,
              currency: "EUR",
              formattedPrice: "€9.00",
            },
          },
          trial: null,
        },
        defaultSubscriptionOption: {
          id: "base_option",
          priceId: "prca9ad8d30922442b58e05",
          base: {
            periodDuration: "P1W",
            period: {
              number: 1,
              unit: "week",
            },
            cycleCount: 1,
            price: {
              amount: 900,
              amountMicros: 9000000,
              currency: "EUR",
              formattedPrice: "€9.00",
            },
          },
          trial: null,
        },
        subscriptionOptions: {
          base_option: {
            id: "base_option",
            priceId: "prca9ad8d30922442b58e05",
            base: {
              periodDuration: "P1W",
              period: {
                number: 1,
                unit: "week",
              },
              cycleCount: 1,
              price: {
                amount: 900,
                amountMicros: 9000000,
                currency: "EUR",
                formattedPrice: "€9.00",
              },
            },
            trial: null,
          },
        },
        defaultNonSubscriptionOption: null,
      },
      packageType: "$rc_weekly",
    },
    trial: {
      identifier: "trial",
      rcBillingProduct: {
        identifier: "mario_with_trial",
        displayName: "Trial Mario",
        title: "Trial Mario",
        description: "Mario with a trial",
        productType: "subscription",
        currentPrice: {
          amount: 3000,
          amountMicros: 30000000,
          currency: "EUR",
          formattedPrice: "€30.00",
        },
        normalPeriodDuration: "P1M",
        presentedOfferingIdentifier: "MultiCurrencyTest",
        presentedOfferingContext: {
          offeringIdentifier: "MultiCurrencyTest",
          targetingContext: null,
          placementIdentifier: null,
        },
        defaultPurchaseOption: {
          id: "offerbd69715c768244238f6b6acc84c85c4c",
          priceId: "prc028090d2f0cd45b08559",
          base: {
            periodDuration: "P1M",
            period: {
              number: 1,
              unit: "month",
            },
            cycleCount: 1,
            price: {
              amount: 3000,
              amountMicros: 30000000,
              currency: "EUR",
              formattedPrice: "€30.00",
            },
          },
          trial: {
            periodDuration: "P2W",
            period: {
              number: 2,
              unit: "week",
            },
            cycleCount: 1,
            price: null,
          },
        },
        defaultSubscriptionOption: {
          id: "offerbd69715c768244238f6b6acc84c85c4c",
          priceId: "prc028090d2f0cd45b08559",
          base: {
            periodDuration: "P1M",
            period: {
              number: 1,
              unit: "month",
            },
            cycleCount: 1,
            price: {
              amount: 3000,
              amountMicros: 30000000,
              currency: "EUR",
              formattedPrice: "€30.00",
            },
          },
          trial: {
            periodDuration: "P2W",
            period: {
              number: 2,
              unit: "week",
            },
            cycleCount: 1,
            price: null,
          },
        },
        subscriptionOptions: {
          offerbd69715c768244238f6b6acc84c85c4c: {
            id: "offerbd69715c768244238f6b6acc84c85c4c",
            priceId: "prc028090d2f0cd45b08559",
            base: {
              periodDuration: "P1M",
              period: {
                number: 1,
                unit: "month",
              },
              cycleCount: 1,
              price: {
                amount: 3000,
                amountMicros: 30000000,
                currency: "EUR",
                formattedPrice: "€30.00",
              },
            },
            trial: {
              periodDuration: "P2W",
              period: {
                number: 2,
                unit: "week",
              },
              cycleCount: 1,
              price: null,
            },
          },
        },
        defaultNonSubscriptionOption: null,
      },
      packageType: "custom",
    },
  },
  availablePackages: [
    {
      identifier: "$rc_monthly",
      rcBillingProduct: {
        identifier: "test_multicurrency_all_currencies",
        displayName: "Mario",
        title: "Mario",
        description:
          "Just the best for Italian supercalifragilisticexpialidocious plumbers, groom them on a monthly basis",
        productType: "subscription",
        currentPrice: {
          amount: 900,
          amountMicros: 9000000,
          currency: "EUR",
          formattedPrice: "€9.00",
        },
        normalPeriodDuration: "P1M",
        presentedOfferingIdentifier: "MultiCurrencyTest",
        presentedOfferingContext: {
          offeringIdentifier: "MultiCurrencyTest",
          targetingContext: null,
          placementIdentifier: null,
        },
        defaultPurchaseOption: {
          id: "base_option",
          priceId: "prcb358d16d7b7744bb8ab0",
          base: {
            periodDuration: "P1M",
            period: {
              number: 1,
              unit: "month",
            },
            cycleCount: 1,
            price: {
              amount: 900,
              amountMicros: 9000000,
              currency: "EUR",
              formattedPrice: "€9.00",
            },
          },
          trial: null,
        },
        defaultSubscriptionOption: {
          id: "base_option",
          priceId: "prcb358d16d7b7744bb8ab0",
          base: {
            periodDuration: "P1M",
            period: {
              number: 1,
              unit: "month",
            },
            cycleCount: 1,
            price: {
              amount: 900,
              amountMicros: 9000000,
              currency: "EUR",
              formattedPrice: "€9.00",
            },
          },
          trial: null,
        },
        subscriptionOptions: {
          base_option: {
            id: "base_option",
            priceId: "prcb358d16d7b7744bb8ab0",
            base: {
              periodDuration: "P1M",
              period: {
                number: 1,
                unit: "month",
              },
              cycleCount: 1,
              price: {
                amount: 900,
                amountMicros: 9000000,
                currency: "EUR",
                formattedPrice: "€9.00",
              },
            },
            trial: null,
          },
        },
        defaultNonSubscriptionOption: null,
      },
      packageType: "$rc_monthly",
    },
    {
      identifier: "$rc_weekly",
      rcBillingProduct: {
        identifier: "luigis_weekly",
        displayName: "Luigi Special",
        title: "Luigi Special",
        description:
          "A fresh alternative to the Mario's, clean them up every week",
        productType: "subscription",
        currentPrice: {
          amount: 900,
          amountMicros: 9000000,
          currency: "EUR",
          formattedPrice: "€9.00",
        },
        normalPeriodDuration: "P1W",
        presentedOfferingIdentifier: "MultiCurrencyTest",
        presentedOfferingContext: {
          offeringIdentifier: "MultiCurrencyTest",
          targetingContext: null,
          placementIdentifier: null,
        },
        defaultPurchaseOption: {
          id: "base_option",
          priceId: "prca9ad8d30922442b58e05",
          base: {
            periodDuration: "P1W",
            period: {
              number: 1,
              unit: "week",
            },
            cycleCount: 1,
            price: {
              amount: 900,
              amountMicros: 9000000,
              currency: "EUR",
              formattedPrice: "€9.00",
            },
          },
          trial: null,
        },
        defaultSubscriptionOption: {
          id: "base_option",
          priceId: "prca9ad8d30922442b58e05",
          base: {
            periodDuration: "P1W",
            period: {
              number: 1,
              unit: "week",
            },
            cycleCount: 1,
            price: {
              amount: 900,
              amountMicros: 9000000,
              currency: "EUR",
              formattedPrice: "€9.00",
            },
          },
          trial: null,
        },
        subscriptionOptions: {
          base_option: {
            id: "base_option",
            priceId: "prca9ad8d30922442b58e05",
            base: {
              periodDuration: "P1W",
              period: {
                number: 1,
                unit: "week",
              },
              cycleCount: 1,
              price: {
                amount: 900,
                amountMicros: 9000000,
                currency: "EUR",
                formattedPrice: "€9.00",
              },
            },
            trial: null,
          },
        },
        defaultNonSubscriptionOption: null,
      },
      packageType: "$rc_weekly",
    },
    {
      identifier: "trial",
      rcBillingProduct: {
        identifier: "mario_with_trial",
        displayName: "Trial Mario",
        title: "Trial Mario",
        description: "Mario with a trial",
        productType: "subscription",
        currentPrice: {
          amount: 3000,
          amountMicros: 30000000,
          currency: "EUR",
          formattedPrice: "€30.00",
        },
        normalPeriodDuration: "P1M",
        presentedOfferingIdentifier: "MultiCurrencyTest",
        presentedOfferingContext: {
          offeringIdentifier: "MultiCurrencyTest",
          targetingContext: null,
          placementIdentifier: null,
        },
        defaultPurchaseOption: {
          id: "offerbd69715c768244238f6b6acc84c85c4c",
          priceId: "prc028090d2f0cd45b08559",
          base: {
            periodDuration: "P1M",
            period: {
              number: 1,
              unit: "month",
            },
            cycleCount: 1,
            price: {
              amount: 3000,
              amountMicros: 30000000,
              currency: "EUR",
              formattedPrice: "€30.00",
            },
          },
          trial: {
            periodDuration: "P2W",
            period: {
              number: 2,
              unit: "week",
            },
            cycleCount: 1,
            price: null,
          },
        } as SubscriptionOption,
        defaultSubscriptionOption: {
          id: "offerbd69715c768244238f6b6acc84c85c4c",
          priceId: "prc028090d2f0cd45b08559",
          base: {
            periodDuration: "P1M",
            period: {
              number: 1,
              unit: "month",
            },
            cycleCount: 1,
            price: {
              amount: 3000,
              amountMicros: 30000000,
              currency: "EUR",
              formattedPrice: "€30.00",
            },
          },
          trial: {
            periodDuration: "P2W",
            period: {
              number: 2,
              unit: "week",
            },
            cycleCount: 1,
            price: null,
          },
        } as SubscriptionOption,
        subscriptionOptions: {
          offerbd69715c768244238f6b6acc84c85c4c: {
            id: "offerbd69715c768244238f6b6acc84c85c4c",
            priceId: "prc028090d2f0cd45b08559",
            base: {
              periodDuration: "P1M",
              period: {
                number: 1,
                unit: "month",
              },
              cycleCount: 1,
              price: {
                amount: 3000,
                amountMicros: 30000000,
                currency: "EUR",
                formattedPrice: "€30.00",
              },
            },
            trial: {
              periodDuration: "P2W",
              period: {
                number: 2,
                unit: "week",
              },
              cycleCount: 1,
              price: null,
            },
          },
        },
        defaultNonSubscriptionOption: null,
      },
      packageType: "custom",
    },
  ],
  lifetime: null,
  annual: null,
  sixMonth: null,
  threeMonth: null,
  twoMonth: null,
  monthly: {
    identifier: "$rc_monthly",
    rcBillingProduct: {
      identifier: "test_multicurrency_all_currencies",
      displayName: "Mario",
      title: "Mario",
      description:
        "Just the best for Italian supercalifragilisticexpialidocious plumbers, groom them on a monthly basis",
      productType: "subscription",
      currentPrice: {
        amount: 900,
        amountMicros: 9000000,
        currency: "EUR",
        formattedPrice: "€9.00",
      },
      normalPeriodDuration: "P1M",
      presentedOfferingIdentifier: "MultiCurrencyTest",
      presentedOfferingContext: {
        offeringIdentifier: "MultiCurrencyTest",
        targetingContext: null,
        placementIdentifier: null,
      },
      defaultPurchaseOption: {
        id: "base_option",
        priceId: "prcb358d16d7b7744bb8ab0",
        base: {
          periodDuration: "P1M",
          period: {
            number: 1,
            unit: "month",
          },
          cycleCount: 1,
          price: {
            amount: 900,
            amountMicros: 9000000,
            currency: "EUR",
            formattedPrice: "€9.00",
          },
        },
        trial: null,
      },
      defaultSubscriptionOption: {
        id: "base_option",
        priceId: "prcb358d16d7b7744bb8ab0",
        base: {
          periodDuration: "P1M",
          period: {
            number: 1,
            unit: "month",
          },
          cycleCount: 1,
          price: {
            amount: 900,
            amountMicros: 9000000,
            currency: "EUR",
            formattedPrice: "€9.00",
          },
        },
        trial: null,
      },
      subscriptionOptions: {
        base_option: {
          id: "base_option",
          priceId: "prcb358d16d7b7744bb8ab0",
          base: {
            periodDuration: "P1M",
            period: {
              number: 1,
              unit: "month",
            },
            cycleCount: 1,
            price: {
              amount: 900,
              amountMicros: 9000000,
              currency: "EUR",
              formattedPrice: "€9.00",
            },
          },
          trial: null,
        },
      },
      defaultNonSubscriptionOption: null,
    },
    packageType: "$rc_monthly",
  },
  weekly: {
    identifier: "$rc_weekly",
    rcBillingProduct: {
      identifier: "luigis_weekly",
      displayName: "Luigi Special",
      title: "Luigi Special",
      description:
        "A fresh alternative to the Mario's, clean them up every week",
      productType: "subscription",
      currentPrice: {
        amount: 900,
        amountMicros: 9000000,
        currency: "EUR",
        formattedPrice: "€9.00",
      },
      normalPeriodDuration: "P1W",
      presentedOfferingIdentifier: "MultiCurrencyTest",
      presentedOfferingContext: {
        offeringIdentifier: "MultiCurrencyTest",
        targetingContext: null,
        placementIdentifier: null,
      },
      defaultPurchaseOption: {
        id: "base_option",
        priceId: "prca9ad8d30922442b58e05",
        base: {
          periodDuration: "P1W",
          period: {
            number: 1,
            unit: "week",
          },
          cycleCount: 1,
          price: {
            amount: 900,
            amountMicros: 9000000,
            currency: "EUR",
            formattedPrice: "€9.00",
          },
        },
        trial: null,
      },
      defaultSubscriptionOption: {
        id: "base_option",
        priceId: "prca9ad8d30922442b58e05",
        base: {
          periodDuration: "P1W",
          period: {
            number: 1,
            unit: "week",
          },
          cycleCount: 1,
          price: {
            amount: 900,
            amountMicros: 9000000,
            currency: "EUR",
            formattedPrice: "€9.00",
          },
        },
        trial: null,
      },
      subscriptionOptions: {
        base_option: {
          id: "base_option",
          priceId: "prca9ad8d30922442b58e05",
          base: {
            periodDuration: "P1W",
            period: {
              number: 1,
              unit: "week",
            },
            cycleCount: 1,
            price: {
              amount: 900,
              amountMicros: 9000000,
              currency: "EUR",
              formattedPrice: "€9.00",
            },
          },
          trial: null,
        },
      },
      defaultNonSubscriptionOption: null,
    },
    packageType: "$rc_weekly",
  },
  paywall_components: null,
} as Offering;

const expectedVariables: any = {
  $rc_monthly: {
    price: "€9.00",
    price_per_period: "€9.00/1mo",
    price_per_period_full: "€9.00/1month",
    product_name: "Mario",
    sub_duration: "1 month",
    sub_duration_in_months: "1 month",
    sub_offer_duration: undefined,
    sub_offer_duration_2: undefined,
    sub_offer_price: undefined,
    sub_offer_price_2: undefined,
    sub_period: "MONTHly",
    sub_period_abbreviated: "mo",
    sub_period_length: "month",
    sub_price_per_month: "9.00",
    sub_price_per_week: "9.00",
    sub_relative_discount: "70% off",
    total_price_and_per_month: "€9.00",
    total_price_and_per_month_full: "€9.00",
  },
  $rc_weekly: {
    price: "€9.00",
    price_per_period: "€9.00/1wk",
    price_per_period_full: "€9.00/1week",
    product_name: "Luigi Special",
    sub_duration: "1 week",
    sub_duration_in_months: "1 week",
    sub_offer_duration: undefined,
    sub_offer_duration_2: undefined,
    sub_offer_price: undefined,
    sub_offer_price_2: undefined,
    sub_period: "WEEKly",
    sub_period_abbreviated: "wk",
    sub_period_length: "week",
    sub_price_per_month: "36.00",
    sub_price_per_week: "9.00",
    sub_relative_discount: "70% off",
    total_price_and_per_month: "($36.00/mo)",
    total_price_and_per_month_full: "($36.00/month)",
  },
  trial: {
    price: "€30.00",
    price_per_period: "€30.00/1mo",
    price_per_period_full: "€30.00/1month",
    product_name: "Trial Mario",
    sub_duration: "1 month",
    sub_duration_in_months: "1 month",
    sub_offer_duration: "2 weeks", // I Guessed this value
    sub_offer_duration_2: undefined,
    sub_offer_price: "free", // I Guessed this value
    sub_offer_price_2: undefined,
    sub_period: "MONTHly",
    sub_period_abbreviated: "mo",
    sub_period_length: "month",
    sub_price_per_month: "30.00",
    sub_price_per_week: "30.00",
    sub_relative_discount: "",
    total_price_and_per_month: "€30.00",
    total_price_and_per_month_full: "€30.00",
  },
};

describe("getPaywallVariables", () => {
  test("should return expected paywall variables", () => {
    expect(parseOfferingIntoVariables(offering)).toEqual(expectedVariables);
  });
});
