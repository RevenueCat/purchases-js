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
  paywall_components: {
    asset_base_url: "https://assets.pawwalls.com",
    components_config: {
      base: {
        stack: {
          background_color: null,
          border: null,
          components: [
            {
              background_color: null,
              border: null,
              components: [
                {
                  components: [],
                  corner_radiuses: {
                    bottom_leading: 0,
                    bottom_trailing: 0,
                    top_leading: 0,
                    top_trailing: 0,
                  },
                  fit_mode: "fill",
                  gradientColors: null,
                  id: "ZRtyX6a5wA",
                  mask_shape: {
                    corners: {
                      bottom_leading: 0,
                      bottom_trailing: 0,
                      top_leading: 0,
                      top_trailing: 0,
                    },
                    type: "rectangle",
                  },
                  name: "",
                  size: {
                    height: {
                      type: "fixed",
                      value: 200,
                    },
                    width: {
                      type: "fill",
                      value: null,
                    },
                  },
                  source: {
                    light: {
                      heic: "https://assets.pawwalls.com/1005820_1731507291.heic",
                      heic_low_res:
                        "https://assets.pawwalls.com/1005820_low_res_1731507291.heic",
                      original:
                        "https://assets.pawwalls.com/1005820_1731507291.jpg",
                      webp: "https://assets.pawwalls.com/1005820_1731507291.webp",
                      webp_low_res:
                        "https://assets.pawwalls.com/1005820_low_res_1731507291.webp",
                    },
                  },
                  type: "image",
                },
                {
                  background_color: null,
                  border: null,
                  components: [
                    {
                      background_color: null,
                      color: {
                        light: {
                          type: "hex",
                          value: "#000000",
                        },
                      },
                      font_name: null,
                      font_size: "heading_xxl",
                      font_weight: "semibold",
                      horizontal_alignment: "leading",
                      id: "J0uTOiJtZ4",
                      margin: {
                        bottom: 0,
                        leading: 0,
                        top: 20,
                        trailing: 0,
                      },
                      name: "",
                      padding: {
                        bottom: 0,
                        leading: 0,
                        top: 0,
                        trailing: 0,
                      },
                      size: {
                        height: {
                          type: "fill",
                          value: null,
                        },
                        width: {
                          type: "fill",
                          value: null,
                        },
                      },
                      text_lid: "m7z87T8PSP",
                      type: "text",
                    },
                    {
                      background_color: null,
                      color: {
                        light: {
                          type: "hex",
                          value: "#000000",
                        },
                      },
                      font_name: null,
                      font_size: "body_m",
                      font_weight: "regular",
                      horizontal_alignment: "leading",
                      id: "-7gk7JWCns",
                      margin: {
                        bottom: 0,
                        leading: 0,
                        top: 0,
                        trailing: 0,
                      },
                      name: "",
                      padding: {
                        bottom: 0,
                        leading: 0,
                        top: 0,
                        trailing: 0,
                      },
                      size: {
                        height: {
                          type: "fit",
                          value: null,
                        },
                        width: {
                          type: "fill",
                          value: null,
                        },
                      },
                      text_lid: "liqxndiEG5",
                      type: "text",
                    },
                  ],
                  dimension: {
                    alignment: "leading",
                    distribution: "space_between",
                    type: "vertical",
                  },
                  id: "_4nezUpsss",
                  margin: {
                    bottom: 10,
                    leading: 10,
                    top: 0,
                    trailing: 10,
                  },
                  name: "",
                  padding: {
                    bottom: 0,
                    leading: 0,
                    top: 0,
                    trailing: 0,
                  },
                  shadow: null,
                  shape: {
                    corners: {
                      bottom_leading: 0,
                      bottom_trailing: 0,
                      top_leading: 0,
                      top_trailing: 0,
                    },
                    type: "rectangle",
                  },
                  size: {
                    height: {
                      type: "fit",
                      value: null,
                    },
                    width: {
                      type: "fill",
                      value: null,
                    },
                  },
                  spacing: 0,
                  type: "stack",
                },
                {
                  background_color: null,
                  border: null,
                  components: [
                    {
                      id: "_BQ1-pbTfN",
                      is_selected_by_default: true,
                      name: "",
                      package_id: "trial",
                      stack: {
                        background_color: null,
                        border: {
                          color: {
                            light: {
                              type: "hex",
                              value: "#ff9613",
                            },
                          },
                          width: 2,
                        },
                        components: [
                          {
                            corner_radiuses: {
                              bottom_leading: 0,
                              bottom_trailing: 0,
                              top_leading: 0,
                              top_trailing: 0,
                            },
                            fit_mode: "fill",
                            gradientColors: null,
                            id: "HBf9zsTJTE",
                            mask_shape: {
                              corners: {
                                bottom_leading: 0,
                                bottom_trailing: 0,
                                top_leading: 0,
                                top_trailing: 0,
                              },
                              type: "rectangle",
                            },
                            name: "",
                            size: {
                              height: {
                                type: "fixed",
                                value: 50,
                              },
                              width: {
                                type: "fixed",
                                value: 50,
                              },
                            },
                            source: {
                              light: {
                                heic: "https://assets.pawwalls.com/1005820_1731507394.heic",
                                heic_low_res:
                                  "https://assets.pawwalls.com/1005820_low_res_1731507394.heic",
                                original:
                                  "https://assets.pawwalls.com/1005820_1731507394.jpg",
                                webp: "https://assets.pawwalls.com/1005820_1731507394.webp",
                                webp_low_res:
                                  "https://assets.pawwalls.com/1005820_low_res_1731507394.webp",
                              },
                            },
                            type: "image",
                          },
                          {
                            background_color: null,
                            border: null,
                            components: [
                              {
                                background_color: null,
                                color: {
                                  light: {
                                    type: "hex",
                                    value: "#000000",
                                  },
                                },
                                components: [],
                                font_name: null,
                                font_size: "heading_s",
                                font_weight: "regular",
                                horizontal_alignment: "leading",
                                id: "9LdulxNGth",
                                margin: {
                                  bottom: 0,
                                  leading: 0,
                                  top: 0,
                                  trailing: 0,
                                },
                                name: "",
                                padding: {
                                  bottom: 0,
                                  leading: 0,
                                  top: 0,
                                  trailing: 0,
                                },
                                size: {
                                  height: {
                                    type: "fit",
                                    value: null,
                                  },
                                  width: {
                                    type: "fill",
                                    value: null,
                                  },
                                },
                                text_lid: "u6M-gcEXcW",
                                type: "text",
                              },
                              {
                                background_color: null,
                                color: {
                                  light: {
                                    type: "hex",
                                    value: "#000000",
                                  },
                                },
                                components: [],
                                font_name: null,
                                font_size: "body_s",
                                font_weight: "regular",
                                horizontal_alignment: "leading",
                                id: "panhwCWZic",
                                margin: {
                                  bottom: 0,
                                  leading: 0,
                                  top: 0,
                                  trailing: 0,
                                },
                                name: "",
                                padding: {
                                  bottom: 0,
                                  leading: 0,
                                  top: 0,
                                  trailing: 0,
                                },
                                size: {
                                  height: {
                                    type: "fit",
                                    value: null,
                                  },
                                  width: {
                                    type: "fill",
                                    value: null,
                                  },
                                },
                                text_lid: "g1GH43IJNX",
                                type: "text",
                              },
                            ],
                            dimension: {
                              alignment: "center",
                              distribution: "space_around",
                              type: "vertical",
                            },
                            id: "kebfIK8l5z",
                            margin: {
                              bottom: 0,
                              leading: 10,
                              top: 0,
                              trailing: 0,
                            },
                            name: "",
                            padding: {
                              bottom: 0,
                              leading: 0,
                              top: 0,
                              trailing: 0,
                            },
                            shadow: null,
                            shape: {
                              corners: {
                                bottom_leading: 0,
                                bottom_trailing: 0,
                                top_leading: 0,
                                top_trailing: 0,
                              },
                              type: "rectangle",
                            },
                            size: {
                              height: {
                                type: "fill",
                                value: null,
                              },
                              width: {
                                type: "fill",
                                value: null,
                              },
                            },
                            spacing: 0,
                            type: "stack",
                          },
                          {
                            background_color: null,
                            border: null,
                            components: [
                              {
                                background_color: null,
                                color: {
                                  light: {
                                    type: "hex",
                                    value: "#000000",
                                  },
                                },
                                font_name: null,
                                font_size: "heading_l",
                                font_weight: "regular",
                                horizontal_alignment: "center",
                                id: "_WVFnjmmDL",
                                margin: {
                                  bottom: 0,
                                  leading: 0,
                                  top: 0,
                                  trailing: 0,
                                },
                                name: "",
                                padding: {
                                  bottom: 0,
                                  leading: 0,
                                  top: 0,
                                  trailing: 0,
                                },
                                size: {
                                  height: {
                                    type: "fit",
                                    value: null,
                                  },
                                  width: {
                                    type: "fit",
                                    value: null,
                                  },
                                },
                                text_lid: "gIp9E6mbHx",
                                type: "text",
                              },
                            ],
                            dimension: {
                              alignment: "center",
                              distribution: "center",
                              type: "vertical",
                            },
                            id: "d8G8M2fqd7",
                            margin: {
                              bottom: 0,
                              leading: 0,
                              top: 0,
                              trailing: 0,
                            },
                            name: "",
                            padding: {
                              bottom: 0,
                              leading: 0,
                              top: 0,
                              trailing: 0,
                            },
                            shadow: null,
                            shape: {
                              corners: {
                                bottom_leading: 0,
                                bottom_trailing: 0,
                                top_leading: 0,
                                top_trailing: 0,
                              },
                              type: "rectangle",
                            },
                            size: {
                              height: {
                                type: "fill",
                                value: null,
                              },
                              width: {
                                type: "fit",
                                value: null,
                              },
                            },
                            spacing: 0,
                            type: "stack",
                          },
                        ],
                        dimension: {
                          alignment: "leading",
                          distribution: "space_between",
                          type: "horizontal",
                        },
                        id: "Uq3Pg5vEuA",
                        margin: {
                          bottom: 8,
                          leading: 8,
                          top: 8,
                          trailing: 8,
                        },
                        name: "",
                        padding: {
                          bottom: 8,
                          leading: 8,
                          top: 8,
                          trailing: 8,
                        },
                        shadow: null,
                        shape: {
                          corners: {
                            bottom_leading: 8,
                            bottom_trailing: 8,
                            top_leading: 8,
                            top_trailing: 8,
                          },
                          type: "rectangle",
                        },
                        size: {
                          height: {
                            type: "fill",
                            value: null,
                          },
                          width: {
                            type: "fill",
                            value: null,
                          },
                        },
                        spacing: 0,
                        type: "stack",
                      },
                      type: "package",
                    },
                    {
                      components: [
                        {
                          components: [],
                          corner_radiuses: {
                            bottom_leading: 0,
                            bottom_trailing: 0,
                            top_leading: 0,
                            top_trailing: 0,
                          },
                          fit_mode: "fill",
                          gradientColors: null,
                          id: "UJP6KaxM1z",
                          mask_shape: {
                            corners: {
                              bottom_leading: 0,
                              bottom_trailing: 0,
                              top_leading: 0,
                              top_trailing: 0,
                            },
                            type: "rectangle",
                          },
                          name: "",
                          size: {
                            height: {
                              type: "fixed",
                              value: 50,
                            },
                            width: {
                              type: "fixed",
                              value: 50,
                            },
                          },
                          source: {
                            light: {
                              heic: "https://assets.pawwalls.com/1005820_1731507394.heic",
                              heic_low_res:
                                "https://assets.pawwalls.com/1005820_low_res_1731507394.heic",
                              original:
                                "https://assets.pawwalls.com/1005820_1731507394.jpg",
                              webp: "https://assets.pawwalls.com/1005820_1731507394.webp",
                              webp_low_res:
                                "https://assets.pawwalls.com/1005820_low_res_1731507394.webp",
                            },
                          },
                          type: "image",
                        },
                        {
                          background_color: null,
                          border: null,
                          components: [
                            {
                              background_color: null,
                              color: {
                                light: {
                                  type: "hex",
                                  value: "#000000",
                                },
                              },
                              components: [],
                              font_name: null,
                              font_size: "heading_m",
                              font_weight: "regular",
                              horizontal_alignment: "leading",
                              id: "m38jO3Le_I",
                              margin: {
                                bottom: 0,
                                leading: 0,
                                top: 0,
                                trailing: 0,
                              },
                              name: "",
                              padding: {
                                bottom: 0,
                                leading: 0,
                                top: 0,
                                trailing: 0,
                              },
                              size: {
                                height: {
                                  type: "fit",
                                  value: null,
                                },
                                width: {
                                  type: "fill",
                                  value: null,
                                },
                              },
                              text_lid: "Dyf4wUnWhE",
                              type: "text",
                            },
                            {
                              background_color: null,
                              color: {
                                light: {
                                  type: "hex",
                                  value: "#000000",
                                },
                              },
                              components: [],
                              font_name: null,
                              font_size: "body_m",
                              font_weight: "regular",
                              horizontal_alignment: "leading",
                              id: "PhEVfVKXJo",
                              margin: {
                                bottom: 0,
                                leading: 0,
                                top: 0,
                                trailing: 0,
                              },
                              name: "",
                              padding: {
                                bottom: 0,
                                leading: 0,
                                top: 0,
                                trailing: 0,
                              },
                              size: {
                                height: {
                                  type: "fit",
                                  value: null,
                                },
                                width: {
                                  type: "fill",
                                  value: null,
                                },
                              },
                              text_lid: "uYHuXwbuaS",
                              type: "text",
                            },
                          ],
                          dimension: {
                            alignment: "center",
                            distribution: "space_around",
                            type: "vertical",
                          },
                          id: "o7HqdzQ2TU",
                          margin: {
                            bottom: 0,
                            leading: 10,
                            top: 0,
                            trailing: 0,
                          },
                          name: "",
                          padding: {
                            bottom: 0,
                            leading: 0,
                            top: 0,
                            trailing: 0,
                          },
                          shadow: null,
                          shape: {
                            corners: {
                              bottom_leading: 0,
                              bottom_trailing: 0,
                              top_leading: 0,
                              top_trailing: 0,
                            },
                            type: "rectangle",
                          },
                          size: {
                            height: {
                              type: "fill",
                              value: null,
                            },
                            width: {
                              type: "fill",
                              value: null,
                            },
                          },
                          spacing: 0,
                          type: "stack",
                        },
                        {
                          background_color: null,
                          border: null,
                          components: [
                            {
                              background_color: null,
                              color: {
                                light: {
                                  type: "hex",
                                  value: "#000000",
                                },
                              },
                              components: [],
                              font_name: null,
                              font_size: "heading_l",
                              font_weight: "regular",
                              horizontal_alignment: "center",
                              id: "fJDKVj_OrR",
                              margin: {
                                bottom: 0,
                                leading: 0,
                                top: 0,
                                trailing: 0,
                              },
                              name: "",
                              padding: {
                                bottom: 0,
                                leading: 0,
                                top: 0,
                                trailing: 0,
                              },
                              size: {
                                height: {
                                  type: "fit",
                                  value: null,
                                },
                                width: {
                                  type: "fill",
                                  value: null,
                                },
                              },
                              text_lid: "S86nOe2AE7",
                              type: "text",
                            },
                          ],
                          dimension: {
                            alignment: "center",
                            distribution: "center",
                            type: "vertical",
                          },
                          id: "JvVkiF7ZGN",
                          margin: {
                            bottom: 0,
                            leading: 0,
                            top: 0,
                            trailing: 0,
                          },
                          name: "",
                          padding: {
                            bottom: 0,
                            leading: 0,
                            top: 0,
                            trailing: 0,
                          },
                          shadow: null,
                          shape: {
                            corners: {
                              bottom_leading: 0,
                              bottom_trailing: 0,
                              top_leading: 0,
                              top_trailing: 0,
                            },
                            type: "rectangle",
                          },
                          size: {
                            height: {
                              type: "fill",
                              value: null,
                            },
                            width: {
                              type: "fill",
                              value: null,
                            },
                          },
                          spacing: 0,
                          type: "stack",
                        },
                      ],
                      id: "ANCHtOyphz",
                      is_selected_by_default: false,
                      name: "",
                      package_id: "$rc_weekly",
                      stack: {
                        background_color: null,
                        border: {
                          color: {
                            light: {
                              type: "hex",
                              value: "#89ba35",
                            },
                          },
                          width: 2,
                        },
                        components: [
                          {
                            components: [],
                            corner_radiuses: {
                              bottom_leading: 0,
                              bottom_trailing: 0,
                              top_leading: 0,
                              top_trailing: 0,
                            },
                            fit_mode: "fill",
                            gradientColors: null,
                            id: "oQq6puI8yg",
                            mask_shape: {
                              corners: {
                                bottom_leading: 0,
                                bottom_trailing: 0,
                                top_leading: 0,
                                top_trailing: 0,
                              },
                              type: "rectangle",
                            },
                            name: "",
                            size: {
                              height: {
                                type: "fixed",
                                value: 50,
                              },
                              width: {
                                type: "fixed",
                                value: 50,
                              },
                            },
                            source: {
                              light: {
                                heic: "https://assets.pawwalls.com/1005820_1731507948.heic",
                                heic_low_res:
                                  "https://assets.pawwalls.com/1005820_low_res_1731507948.heic",
                                original:
                                  "https://assets.pawwalls.com/1005820_1731507948.jpg",
                                webp: "https://assets.pawwalls.com/1005820_1731507948.webp",
                                webp_low_res:
                                  "https://assets.pawwalls.com/1005820_low_res_1731507948.webp",
                              },
                            },
                            type: "image",
                          },
                          {
                            background_color: null,
                            border: null,
                            components: [
                              {
                                background_color: null,
                                color: {
                                  light: {
                                    type: "hex",
                                    value: "#000000",
                                  },
                                },
                                components: [],
                                font_name: null,
                                font_size: "heading_s",
                                font_weight: "regular",
                                horizontal_alignment: "leading",
                                id: "hT1CeHcStR",
                                margin: {
                                  bottom: 0,
                                  leading: 0,
                                  top: 0,
                                  trailing: 0,
                                },
                                name: "",
                                padding: {
                                  bottom: 0,
                                  leading: 0,
                                  top: 0,
                                  trailing: 0,
                                },
                                size: {
                                  height: {
                                    type: "fit",
                                    value: null,
                                  },
                                  width: {
                                    type: "fill",
                                    value: null,
                                  },
                                },
                                text_lid: "0p9AOAKWPR",
                                type: "text",
                              },
                              {
                                background_color: null,
                                color: {
                                  light: {
                                    type: "hex",
                                    value: "#000000",
                                  },
                                },
                                components: [],
                                font_name: null,
                                font_size: "body_s",
                                font_weight: "regular",
                                horizontal_alignment: "leading",
                                id: "lo5eR8WmHo",
                                margin: {
                                  bottom: 0,
                                  leading: 0,
                                  top: 0,
                                  trailing: 0,
                                },
                                name: "",
                                padding: {
                                  bottom: 0,
                                  leading: 0,
                                  top: 0,
                                  trailing: 0,
                                },
                                size: {
                                  height: {
                                    type: "fit",
                                    value: null,
                                  },
                                  width: {
                                    type: "fill",
                                    value: null,
                                  },
                                },
                                text_lid: "MSh-LJfsBU",
                                type: "text",
                              },
                            ],
                            dimension: {
                              alignment: "center",
                              distribution: "space_around",
                              type: "vertical",
                            },
                            id: "UZHeHr6dEg",
                            margin: {
                              bottom: 0,
                              leading: 10,
                              top: 0,
                              trailing: 0,
                            },
                            name: "",
                            padding: {
                              bottom: 0,
                              leading: 0,
                              top: 0,
                              trailing: 0,
                            },
                            shadow: null,
                            shape: {
                              corners: {
                                bottom_leading: 0,
                                bottom_trailing: 0,
                                top_leading: 0,
                                top_trailing: 0,
                              },
                              type: "rectangle",
                            },
                            size: {
                              height: {
                                type: "fill",
                                value: null,
                              },
                              width: {
                                type: "fill",
                                value: null,
                              },
                            },
                            spacing: 0,
                            type: "stack",
                          },
                          {
                            background_color: null,
                            border: null,
                            components: [
                              {
                                background_color: null,
                                color: {
                                  light: {
                                    type: "hex",
                                    value: "#000000",
                                  },
                                },
                                components: [],
                                font_name: null,
                                font_size: "heading_l",
                                font_weight: "regular",
                                horizontal_alignment: "center",
                                id: "LiGo-dcmgf",
                                margin: {
                                  bottom: 0,
                                  leading: 0,
                                  top: 0,
                                  trailing: 0,
                                },
                                name: "",
                                padding: {
                                  bottom: 0,
                                  leading: 0,
                                  top: 0,
                                  trailing: 0,
                                },
                                size: {
                                  height: {
                                    type: "fit",
                                    value: null,
                                  },
                                  width: {
                                    type: "fit",
                                    value: null,
                                  },
                                },
                                text_lid: "5VCCUXYXE_",
                                type: "text",
                              },
                            ],
                            dimension: {
                              alignment: "center",
                              distribution: "center",
                              type: "vertical",
                            },
                            id: "8XYczSBj0r",
                            margin: {
                              bottom: 0,
                              leading: 0,
                              top: 0,
                              trailing: 0,
                            },
                            name: "",
                            padding: {
                              bottom: 0,
                              leading: 0,
                              top: 0,
                              trailing: 0,
                            },
                            shadow: null,
                            shape: {
                              corners: {
                                bottom_leading: 0,
                                bottom_trailing: 0,
                                top_leading: 0,
                                top_trailing: 0,
                              },
                              type: "rectangle",
                            },
                            size: {
                              height: {
                                type: "fill",
                                value: null,
                              },
                              width: {
                                type: "fit",
                                value: null,
                              },
                            },
                            spacing: 0,
                            type: "stack",
                          },
                        ],
                        dimension: {
                          alignment: "leading",
                          distribution: "space_between",
                          type: "horizontal",
                        },
                        id: "0La7GuvwA5",
                        margin: {
                          bottom: 8,
                          leading: 8,
                          top: 8,
                          trailing: 8,
                        },
                        name: "",
                        padding: {
                          bottom: 8,
                          leading: 8,
                          top: 8,
                          trailing: 8,
                        },
                        shadow: null,
                        shape: {
                          corners: {
                            bottom_leading: 8,
                            bottom_trailing: 8,
                            top_leading: 8,
                            top_trailing: 8,
                          },
                          type: "rectangle",
                        },
                        size: {
                          height: {
                            type: "fill",
                            value: null,
                          },
                          width: {
                            type: "fill",
                            value: null,
                          },
                        },
                        spacing: 0,
                        type: "stack",
                      },
                      type: "package",
                    },
                    {
                      components: [
                        {
                          components: [],
                          corner_radiuses: {
                            bottom_leading: 0,
                            bottom_trailing: 0,
                            top_leading: 0,
                            top_trailing: 0,
                          },
                          fit_mode: "fill",
                          gradientColors: null,
                          id: "02WAaD8XKF",
                          mask_shape: {
                            corners: {
                              bottom_leading: 0,
                              bottom_trailing: 0,
                              top_leading: 0,
                              top_trailing: 0,
                            },
                            type: "rectangle",
                          },
                          name: "",
                          size: {
                            height: {
                              type: "fixed",
                              value: 50,
                            },
                            width: {
                              type: "fixed",
                              value: 50,
                            },
                          },
                          source: {
                            light: {
                              heic: "https://assets.pawwalls.com/1005820_1731507948.heic",
                              heic_low_res:
                                "https://assets.pawwalls.com/1005820_low_res_1731507948.heic",
                              original:
                                "https://assets.pawwalls.com/1005820_1731507948.jpg",
                              webp: "https://assets.pawwalls.com/1005820_1731507948.webp",
                              webp_low_res:
                                "https://assets.pawwalls.com/1005820_low_res_1731507948.webp",
                            },
                          },
                          type: "image",
                        },
                        {
                          background_color: null,
                          border: null,
                          components: [
                            {
                              background_color: null,
                              color: {
                                light: {
                                  type: "hex",
                                  value: "#000000",
                                },
                              },
                              components: [],
                              font_name: null,
                              font_size: "heading_m",
                              font_weight: "regular",
                              horizontal_alignment: "leading",
                              id: "9d0803AIPl",
                              margin: {
                                bottom: 0,
                                leading: 0,
                                top: 0,
                                trailing: 0,
                              },
                              name: "",
                              padding: {
                                bottom: 0,
                                leading: 0,
                                top: 0,
                                trailing: 0,
                              },
                              size: {
                                height: {
                                  type: "fit",
                                  value: null,
                                },
                                width: {
                                  type: "fill",
                                  value: null,
                                },
                              },
                              text_lid: "_Y0ghumTD5",
                              type: "text",
                            },
                            {
                              background_color: null,
                              color: {
                                light: {
                                  type: "hex",
                                  value: "#000000",
                                },
                              },
                              components: [],
                              font_name: null,
                              font_size: "body_m",
                              font_weight: "regular",
                              horizontal_alignment: "leading",
                              id: "ASQwu-byJ8",
                              margin: {
                                bottom: 0,
                                leading: 0,
                                top: 0,
                                trailing: 0,
                              },
                              name: "",
                              padding: {
                                bottom: 0,
                                leading: 0,
                                top: 0,
                                trailing: 0,
                              },
                              size: {
                                height: {
                                  type: "fit",
                                  value: null,
                                },
                                width: {
                                  type: "fill",
                                  value: null,
                                },
                              },
                              text_lid: "AUpQIYlXNL",
                              type: "text",
                            },
                          ],
                          dimension: {
                            alignment: "center",
                            distribution: "space_around",
                            type: "vertical",
                          },
                          id: "iaM1FOE80e",
                          margin: {
                            bottom: 0,
                            leading: 10,
                            top: 0,
                            trailing: 0,
                          },
                          name: "",
                          padding: {
                            bottom: 0,
                            leading: 0,
                            top: 0,
                            trailing: 0,
                          },
                          shadow: null,
                          shape: {
                            corners: {
                              bottom_leading: 0,
                              bottom_trailing: 0,
                              top_leading: 0,
                              top_trailing: 0,
                            },
                            type: "rectangle",
                          },
                          size: {
                            height: {
                              type: "fill",
                              value: null,
                            },
                            width: {
                              type: "fill",
                              value: null,
                            },
                          },
                          spacing: 0,
                          type: "stack",
                        },
                        {
                          background_color: null,
                          border: null,
                          components: [
                            {
                              background_color: null,
                              color: {
                                light: {
                                  type: "hex",
                                  value: "#000000",
                                },
                              },
                              components: [],
                              font_name: null,
                              font_size: "heading_l",
                              font_weight: "regular",
                              horizontal_alignment: "center",
                              id: "fuAokcg689",
                              margin: {
                                bottom: 0,
                                leading: 0,
                                top: 0,
                                trailing: 0,
                              },
                              name: "",
                              padding: {
                                bottom: 0,
                                leading: 0,
                                top: 0,
                                trailing: 0,
                              },
                              size: {
                                height: {
                                  type: "fit",
                                  value: null,
                                },
                                width: {
                                  type: "fill",
                                  value: null,
                                },
                              },
                              text_lid: "qZGArQlrjz",
                              type: "text",
                            },
                          ],
                          dimension: {
                            alignment: "center",
                            distribution: "center",
                            type: "vertical",
                          },
                          id: "yiNktg7U9K",
                          margin: {
                            bottom: 0,
                            leading: 0,
                            top: 0,
                            trailing: 0,
                          },
                          name: "",
                          padding: {
                            bottom: 0,
                            leading: 0,
                            top: 0,
                            trailing: 0,
                          },
                          shadow: null,
                          shape: {
                            corners: {
                              bottom_leading: 0,
                              bottom_trailing: 0,
                              top_leading: 0,
                              top_trailing: 0,
                            },
                            type: "rectangle",
                          },
                          size: {
                            height: {
                              type: "fill",
                              value: null,
                            },
                            width: {
                              type: "fill",
                              value: null,
                            },
                          },
                          spacing: 0,
                          type: "stack",
                        },
                      ],
                      id: "mF4hGFgF15",
                      is_selected_by_default: false,
                      name: "",
                      package_id: "$rc_weekly",
                      stack: {
                        background_color: null,
                        border: {
                          color: {
                            light: {
                              type: "hex",
                              value: "#89ba35",
                            },
                          },
                          width: 2,
                        },
                        components: [
                          {
                            components: [],
                            corner_radiuses: {
                              bottom_leading: 0,
                              bottom_trailing: 0,
                              top_leading: 0,
                              top_trailing: 0,
                            },
                            fit_mode: "fill",
                            gradientColors: null,
                            id: "Odky2rECEo",
                            mask_shape: {
                              corners: {
                                bottom_leading: 0,
                                bottom_trailing: 0,
                                top_leading: 0,
                                top_trailing: 0,
                              },
                              type: "rectangle",
                            },
                            name: "",
                            size: {
                              height: {
                                type: "fixed",
                                value: 50,
                              },
                              width: {
                                type: "fixed",
                                value: 50,
                              },
                            },
                            source: {
                              light: {
                                heic: "https://assets.pawwalls.com/1005820_1731508103.heic",
                                heic_low_res:
                                  "https://assets.pawwalls.com/1005820_low_res_1731508103.heic",
                                original:
                                  "https://assets.pawwalls.com/1005820_1731508103.jpg",
                                webp: "https://assets.pawwalls.com/1005820_1731508103.webp",
                                webp_low_res:
                                  "https://assets.pawwalls.com/1005820_low_res_1731508103.webp",
                              },
                            },
                            type: "image",
                          },
                          {
                            background_color: null,
                            border: null,
                            components: [
                              {
                                background_color: null,
                                color: {
                                  light: {
                                    type: "hex",
                                    value: "#000000",
                                  },
                                },
                                components: [],
                                font_name: null,
                                font_size: "heading_s",
                                font_weight: "regular",
                                horizontal_alignment: "leading",
                                id: "3HOzWgmRXQ",
                                margin: {
                                  bottom: 0,
                                  leading: 0,
                                  top: 0,
                                  trailing: 0,
                                },
                                name: "",
                                padding: {
                                  bottom: 0,
                                  leading: 0,
                                  top: 0,
                                  trailing: 0,
                                },
                                size: {
                                  height: {
                                    type: "fit",
                                    value: null,
                                  },
                                  width: {
                                    type: "fill",
                                    value: null,
                                  },
                                },
                                text_lid: "GwWK2MqMh8",
                                type: "text",
                              },
                              {
                                background_color: null,
                                color: {
                                  light: {
                                    type: "hex",
                                    value: "#000000",
                                  },
                                },
                                components: [],
                                font_name: null,
                                font_size: "body_s",
                                font_weight: "regular",
                                horizontal_alignment: "leading",
                                id: "YAglfUSAd9",
                                margin: {
                                  bottom: 0,
                                  leading: 0,
                                  top: 0,
                                  trailing: 0,
                                },
                                name: "",
                                padding: {
                                  bottom: 0,
                                  leading: 0,
                                  top: 0,
                                  trailing: 0,
                                },
                                size: {
                                  height: {
                                    type: "fit",
                                    value: null,
                                  },
                                  width: {
                                    type: "fill",
                                    value: null,
                                  },
                                },
                                text_lid: "fEmLNVyV6Z",
                                type: "text",
                              },
                            ],
                            dimension: {
                              alignment: "center",
                              distribution: "space_around",
                              type: "vertical",
                            },
                            id: "zwH4qw1F8i",
                            margin: {
                              bottom: 0,
                              leading: 10,
                              top: 0,
                              trailing: 0,
                            },
                            name: "",
                            padding: {
                              bottom: 0,
                              leading: 0,
                              top: 0,
                              trailing: 0,
                            },
                            shadow: null,
                            shape: {
                              corners: {
                                bottom_leading: 0,
                                bottom_trailing: 0,
                                top_leading: 0,
                                top_trailing: 0,
                              },
                              type: "rectangle",
                            },
                            size: {
                              height: {
                                type: "fill",
                                value: null,
                              },
                              width: {
                                type: "fill",
                                value: null,
                              },
                            },
                            spacing: 0,
                            type: "stack",
                          },
                          {
                            background_color: null,
                            border: null,
                            components: [
                              {
                                background_color: null,
                                color: {
                                  light: {
                                    type: "hex",
                                    value: "#000000",
                                  },
                                },
                                components: [],
                                font_name: null,
                                font_size: "heading_l",
                                font_weight: "regular",
                                horizontal_alignment: "center",
                                id: "NKedS9c3k1",
                                margin: {
                                  bottom: 0,
                                  leading: 0,
                                  top: 0,
                                  trailing: 0,
                                },
                                name: "",
                                padding: {
                                  bottom: 0,
                                  leading: 0,
                                  top: 0,
                                  trailing: 0,
                                },
                                size: {
                                  height: {
                                    type: "fit",
                                    value: null,
                                  },
                                  width: {
                                    type: "fit",
                                    value: null,
                                  },
                                },
                                text_lid: "p-t9fjX1Cx",
                                type: "text",
                              },
                            ],
                            dimension: {
                              alignment: "center",
                              distribution: "center",
                              type: "vertical",
                            },
                            id: "bqEnx1hNs_",
                            margin: {
                              bottom: 0,
                              leading: 0,
                              top: 0,
                              trailing: 0,
                            },
                            name: "",
                            padding: {
                              bottom: 0,
                              leading: 0,
                              top: 0,
                              trailing: 0,
                            },
                            shadow: null,
                            shape: {
                              corners: {
                                bottom_leading: 0,
                                bottom_trailing: 0,
                                top_leading: 0,
                                top_trailing: 0,
                              },
                              type: "rectangle",
                            },
                            size: {
                              height: {
                                type: "fill",
                                value: null,
                              },
                              width: {
                                type: "fit",
                                value: null,
                              },
                            },
                            spacing: 0,
                            type: "stack",
                          },
                        ],
                        dimension: {
                          alignment: "leading",
                          distribution: "space_between",
                          type: "horizontal",
                        },
                        id: "ueMDY-CGTK",
                        margin: {
                          bottom: 8,
                          leading: 8,
                          top: 8,
                          trailing: 8,
                        },
                        name: "",
                        padding: {
                          bottom: 8,
                          leading: 8,
                          top: 8,
                          trailing: 8,
                        },
                        shadow: null,
                        shape: {
                          corners: {
                            bottom_leading: 8,
                            bottom_trailing: 8,
                            top_leading: 8,
                            top_trailing: 8,
                          },
                          type: "rectangle",
                        },
                        size: {
                          height: {
                            type: "fill",
                            value: null,
                          },
                          width: {
                            type: "fill",
                            value: null,
                          },
                        },
                        spacing: 0,
                        type: "stack",
                      },
                      type: "package",
                    },
                  ],
                  dimension: {
                    alignment: "leading",
                    distribution: "space_between",
                    type: "vertical",
                  },
                  id: "Ne8vLH5ND5",
                  margin: {
                    bottom: 0,
                    leading: 0,
                    top: 0,
                    trailing: 0,
                  },
                  name: "",
                  padding: {
                    bottom: 0,
                    leading: 0,
                    top: 0,
                    trailing: 0,
                  },
                  shadow: null,
                  shape: {
                    corners: {
                      bottom_leading: 0,
                      bottom_trailing: 0,
                      top_leading: 0,
                      top_trailing: 0,
                    },
                    type: "rectangle",
                  },
                  size: {
                    height: {
                      type: "fit",
                      value: null,
                    },
                    width: {
                      type: "fill",
                      value: null,
                    },
                  },
                  spacing: 0,
                  type: "stack",
                },
                {
                  background_color: null,
                  border: null,
                  components: [],
                  dimension: {
                    alignment: "leading",
                    distribution: "space_between",
                    type: "vertical",
                  },
                  id: "FxEY8rVOiT",
                  margin: {
                    bottom: 0,
                    leading: 0,
                    top: 100,
                    trailing: 0,
                  },
                  name: "",
                  padding: {
                    bottom: 0,
                    leading: 0,
                    top: 0,
                    trailing: 0,
                  },
                  shadow: null,
                  shape: {
                    corners: {
                      bottom_leading: 0,
                      bottom_trailing: 0,
                      top_leading: 0,
                      top_trailing: 0,
                    },
                    type: "rectangle",
                  },
                  size: {
                    height: {
                      type: "fill",
                      value: null,
                    },
                    width: {
                      type: "fill",
                      value: null,
                    },
                  },
                  spacing: 0,
                  type: "stack",
                },
                {
                  background_color: null,
                  border: null,
                  components: [
                    {
                      id: "4E4Y6wmlYD",
                      name: "",
                      stack: {
                        background_color: {
                          light: {
                            type: "hex",
                            value: "#f8ae00",
                          },
                        },
                        border: null,
                        components: [
                          {
                            background_color: null,
                            color: {
                              light: {
                                type: "hex",
                                value: "#000000",
                              },
                            },
                            font_name: null,
                            font_size: "heading_l",
                            font_weight: "regular",
                            horizontal_alignment: "leading",
                            id: "zlaxFD23sH",
                            margin: {
                              bottom: 0,
                              leading: 0,
                              top: 0,
                              trailing: 5,
                            },
                            name: "",
                            padding: {
                              bottom: 0,
                              leading: 0,
                              top: 0,
                              trailing: 0,
                            },
                            size: {
                              height: {
                                type: "fit",
                                value: null,
                              },
                              width: {
                                type: "fit",
                                value: null,
                              },
                            },
                            text_lid: "n9lRmenHex",
                            type: "text",
                          },
                          {
                            background_color: null,
                            color: {
                              light: {
                                type: "hex",
                                value: "#ffffff",
                              },
                            },
                            components: [],
                            font_name: null,
                            font_size: "body_l",
                            font_weight: "bold",
                            horizontal_alignment: "center",
                            id: "aSfbbPQ2kC",
                            margin: {
                              bottom: 10,
                              leading: 0,
                              top: 10,
                              trailing: 10,
                            },
                            name: "",
                            padding: {
                              bottom: 0,
                              leading: 0,
                              top: 0,
                              trailing: 0,
                            },
                            size: {
                              height: {
                                type: "fit",
                                value: null,
                              },
                              width: {
                                type: "fit",
                                value: null,
                              },
                            },
                            text_lid: "oGPXwOE96y",
                            type: "text",
                          },
                        ],
                        dimension: {
                          alignment: "center",
                          distribution: "center",
                          type: "horizontal",
                        },
                        id: "aYJm9SR8aQ",
                        margin: {
                          bottom: 20,
                          leading: 20,
                          top: 20,
                          trailing: 20,
                        },
                        name: "",
                        padding: {
                          bottom: 0,
                          leading: 0,
                          top: 0,
                          trailing: 0,
                        },
                        shadow: null,
                        shape: {
                          corners: {
                            bottom_leading: 0,
                            bottom_trailing: 0,
                            top_leading: 0,
                            top_trailing: 0,
                          },
                          type: "rectangle",
                        },
                        size: {
                          height: {
                            type: "fit",
                            value: null,
                          },
                          width: {
                            type: "fill",
                            value: null,
                          },
                        },
                        spacing: 0,
                        type: "stack",
                      },
                      type: "purchase_button",
                    },
                  ],
                  dimension: {
                    alignment: "leading",
                    distribution: "space_between",
                    type: "vertical",
                  },
                  id: "ohzq0-SjiN",
                  margin: {
                    bottom: 0,
                    leading: 0,
                    top: 0,
                    trailing: 0,
                  },
                  name: "",
                  padding: {
                    bottom: 0,
                    leading: 0,
                    top: 0,
                    trailing: 0,
                  },
                  shadow: null,
                  shape: {
                    corners: {
                      bottom_leading: 0,
                      bottom_trailing: 0,
                      top_leading: 0,
                      top_trailing: 0,
                    },
                    type: "rectangle",
                  },
                  size: {
                    height: {
                      type: "fit",
                      value: null,
                    },
                    width: {
                      type: "fill",
                      value: null,
                    },
                  },
                  spacing: 0,
                  type: "stack",
                },
              ],
              dimension: {
                alignment: "leading",
                distribution: "space_between",
                type: "vertical",
              },
              id: "DbELXQo-Mf",
              margin: {
                bottom: 10,
                leading: 0,
                top: 0,
                trailing: 0,
              },
              name: "",
              padding: {
                bottom: 0,
                leading: 0,
                top: 0,
                trailing: 0,
              },
              shadow: null,
              shape: {
                corners: {
                  bottom_leading: 0,
                  bottom_trailing: 0,
                  top_leading: 0,
                  top_trailing: 0,
                },
                type: "rectangle",
              },
              size: {
                height: {
                  type: "fill",
                  value: null,
                },
                width: {
                  type: "fill",
                  value: null,
                },
              },
              spacing: 0,
              type: "stack",
            },
          ],
          dimension: {
            alignment: "leading",
            distribution: "start",
            type: "vertical",
          },
          id: "V37ijIojFr",
          margin: {
            bottom: 0,
            leading: 0,
            top: 0,
            trailing: 0,
          },
          name: "Content",
          padding: {
            bottom: 0,
            leading: 0,
            top: 0,
            trailing: 0,
          },
          shadow: null,
          shape: {
            corners: {
              bottom_leading: 0,
              bottom_trailing: 0,
              top_leading: 0,
              top_trailing: 0,
            },
            type: "rectangle",
          },
          size: {
            height: {
              type: "fit",
              value: null,
            },
            width: {
              type: "fill",
              value: null,
            },
          },
          spacing: 0,
          type: "stack",
        },
        sticky_footer: null,
      },
    },
    components_localizations: {
      en_US: {
        "0p9AOAKWPR": "Paccheri",
        "5VCCUXYXE_": "10.99$",
        AUpQIYlXNL: "500g - 9 min",
        Dyf4wUnWhE: "Spaghetti",
        GwWK2MqMh8: "Penne rigate",
        "MSh-LJfsBU": "500g - 15 min",
        S86nOe2AE7: "12.99",
        _Y0ghumTD5: "Paccheri",
        fEmLNVyV6Z: "500g - 12 min",
        g1GH43IJNX: "500g - 9 min",
        gIp9E6mbHx: "12.99$",
        liqxndiEG5: "Every day a new type of pasta",
        m7z87T8PSP: "Pasta-a-porter",
        n9lRmenHex: "🍝",
        oGPXwOE96y: "ORDER",
        "p-t9fjX1Cx": "9.99$",
        qZGArQlrjz: "10.99$",
        "u6M-gcEXcW": "Spaghetti",
        uYHuXwbuaS: "500g - 9 min",
      },
    },
    default_locale: "en_US",
    revision: 10,
    template_name: "components",
    zero_decimal_place_countries: {
      apple: ["TWN", "KAZ", "MEX", "PHL", "THA"],
      google: ["TW", "KZ", "MX", "PH", "TH"],
    },
  },
} as Offering;

const expectedVariables: any = {};

Object.entries(offering.packagesById).forEach(([pkgId, pkg]) => {
  expectedVariables[pkgId] = {
    product_name: pkg.rcBillingProduct.title,
    price: pkg.rcBillingProduct.currentPrice.formattedPrice,
    price_per_period: "",
    price_per_period_full: "",
    total_price_and_per_month: "",
    total_price_and_per_month_full: "",
    sub_price_per_month: "",
    sub_price_per_week: "",
    sub_duration: "",
    sub_duration_in_months: "",
    sub_period: "",
    sub_period_length: "",
    sub_period_abbreviated: "",
    sub_offer_duration: undefined, // doesn't apply (yet)
    sub_offer_duration_2: undefined, // doesn't apply - only google play
    sub_offer_price: undefined, // doesn't apply (yet)
    sub_offer_price_2: undefined, // doesn't apply - only google play
    sub_relative_discount: "",
  };
});

describe("getPaywallVariables", () => {
  test("should return expected paywall variables", () => {
    expect(parseOfferingIntoVariables(offering)).toEqual(expectedVariables);
  });
});
