import { describe, expect, test } from "vitest";
import { parseOfferingIntoVariables } from "../../helpers/paywall-variables-helpers";
import type { Offering, SubscriptionOption } from "../../entities/offerings";
import { Translator } from "../../ui/localization/translator";
import { englishLocale } from "../../ui/localization/constants";

const monthlyProduct = {
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
  price: {
    amount: 900,
    amountMicros: 9000000,
    currency: "EUR",
    formattedPrice: "€9.00",
  },
  duration: "P1M",
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
      pricePerWeek: {
        amount: 210,
        amountMicros: 2100000,
        currency: "EUR",
        formattedPrice: "€2.10",
      },
      pricePerMonth: {
        amount: 900,
        amountMicros: 9000000,
        currency: "EUR",
        formattedPrice: "€9.00",
      },
      pricePerYear: {
        amount: 10950,
        amountMicros: 109500000,
        currency: "EUR",
        formattedPrice: "€109.50",
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
      pricePerWeek: {
        amount: 210,
        amountMicros: 2100000,
        currency: "EUR",
        formattedPrice: "€2.10",
      },
      pricePerMonth: {
        amount: 900,
        amountMicros: 9000000,
        currency: "EUR",
        formattedPrice: "€9.00",
      },
      pricePerYear: {
        amount: 10950,
        amountMicros: 109500000,
        currency: "EUR",
        formattedPrice: "€109.50",
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
        pricePerWeek: {
          amount: 210,
          amountMicros: 2100000,
          currency: "EUR",
          formattedPrice: "€2.10",
        },
        pricePerMonth: {
          amount: 900,
          amountMicros: 9000000,
          currency: "EUR",
          formattedPrice: "€9.00",
        },
        pricePerYear: {
          amount: 10950,
          amountMicros: 109500000,
          currency: "EUR",
          formattedPrice: "€109.50",
        },
      },
      trial: null,
    },
  },
  defaultNonSubscriptionOption: null,
};

const weeklyProduct = {
  identifier: "luigis_weekly",
  displayName: "Luigi Special",
  title: "Luigi Special",
  description: "A fresh alternative to the Mario's, clean them up every week",
  productType: "subscription",
  currentPrice: {
    amount: 900,
    amountMicros: 9000000,
    currency: "EUR",
    formattedPrice: "€9.00",
  },
  price: {
    amount: 900,
    amountMicros: 9000000,
    currency: "EUR",
    formattedPrice: "€9.00",
  },
  duration: "P1W",
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
      pricePerWeek: {
        amount: 900,
        amountMicros: 9000000,
        currency: "EUR",
        formattedPrice: "€9.00",
      },
      pricePerMonth: {
        amount: 3900,
        amountMicros: 39000000,
        currency: "EUR",
        formattedPrice: "€39.00",
      },
      pricePerYear: {
        amount: 47400,
        amountMicros: 474000000,
        currency: "EUR",
        formattedPrice: "€474.00",
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
      pricePerWeek: {
        amount: 900,
        amountMicros: 9000000,
        currency: "EUR",
        formattedPrice: "€9.00",
      },
      pricePerMonth: {
        amount: 3900,
        amountMicros: 39000000,
        currency: "EUR",
        formattedPrice: "€39.00",
      },
      pricePerYear: {
        amount: 47400,
        amountMicros: 474000000,
        currency: "EUR",
        formattedPrice: "€474.00",
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
        pricePerWeek: {
          amount: 900,
          amountMicros: 9000000,
          currency: "EUR",
          formattedPrice: "€9.00",
        },
        pricePerMonth: {
          amount: 3900,
          amountMicros: 39000000,
          currency: "EUR",
          formattedPrice: "€39.00",
        },
        pricePerYear: {
          amount: 47400,
          amountMicros: 474000000,
          currency: "EUR",
          formattedPrice: "€474.00",
        },
      },
      trial: null,
    },
  },
  defaultNonSubscriptionOption: null,
};

const trialProduct = {
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
  price: {
    amount: 3000,
    amountMicros: 30000000,
    currency: "EUR",
    formattedPrice: "€30.00",
  },
  trialPhase: {
    periodDuration: "P2W",
    period: {
      number: 2,
      unit: "week",
    },
    cycleCount: 1,
    price: null,
    pricePerWeek: null,
    pricePerMonth: null,
    pricePerYear: null,
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
      pricePerWeek: {
        amount: 692.31,
        amountMicros: 6923100,
        currency: "EUR",
        formattedPrice: "€6.92",
      },
      pricePerMonth: {
        amount: 3000,
        amountMicros: 30000000,
        currency: "EUR",
        formattedPrice: "€30.00",
      },
      pricePerYear: {
        amount: 36500,
        amountMicros: 365000000,
        currency: "EUR",
        formattedPrice: "€365.00",
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
      pricePerWeek: null,
      pricePerMonth: null,
      pricePerYear: null,
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
      pricePerWeek: {
        amount: 692.31,
        amountMicros: 6923100,
        currency: "EUR",
        formattedPrice: "€6.92",
      },
      pricePerMonth: {
        amount: 3000,
        amountMicros: 30000000,
        currency: "EUR",
        formattedPrice: "€30.00",
      },
      pricePerYear: {
        amount: 36500,
        amountMicros: 365000000,
        currency: "EUR",
        formattedPrice: "€365.00",
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
      pricePerWeek: null,
      pricePerMonth: null,
      pricePerYear: null,
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
        pricePerWeek: {
          amount: 692.31,
          amountMicros: 6923100,
          currency: "EUR",
          formattedPrice: "€6.92",
        },
        pricePerMonth: {
          amount: 3000,
          amountMicros: 30000000,
          currency: "EUR",
          formattedPrice: "€30.00",
        },
        pricePerYear: {
          amount: 36500,
          amountMicros: 365000000,
          currency: "EUR",
          formattedPrice: "€365.00",
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
        pricePerWeek: null,
        pricePerMonth: null,
        pricePerYear: null,
      },
    },
  },
  defaultNonSubscriptionOption: null,
};

const trialProduct900 = {
  identifier: "mario_with_trial",
  displayName: "Trial Mario",
  title: "Trial Mario",
  description: "Mario with a trial",
  productType: "subscription",
  currentPrice: {
    amount: 900,
    amountMicros: 9000000,
    currency: "EUR",
    formattedPrice: "€9.00",
  },
  price: {
    amount: 900,
    amountMicros: 9000000,
    currency: "EUR",
    formattedPrice: "€9.00",
  },
  trialPhase: {
    periodDuration: "P2W",
    period: {
      number: 2,
      unit: "week",
    },
    cycleCount: 1,
    price: null,
    pricePerWeek: null,
    pricePerMonth: null,
    pricePerYear: null,
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
      pricePerWeek: {
        amount: 692.31,
        amountMicros: 6923100,
        currency: "EUR",
        formattedPrice: "€6.92",
      },
      pricePerMonth: {
        amount: 3000,
        amountMicros: 30000000,
        currency: "EUR",
        formattedPrice: "€30.00",
      },
      pricePerYear: {
        amount: 36500,
        amountMicros: 365000000,
        currency: "EUR",
        formattedPrice: "€365.00",
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
      pricePerWeek: null,
      pricePerMonth: null,
      pricePerYear: null,
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
      pricePerWeek: {
        amount: 692.31,
        amountMicros: 6923100,
        currency: "EUR",
        formattedPrice: "€6.92",
      },
      pricePerMonth: {
        amount: 3000,
        amountMicros: 30000000,
        currency: "EUR",
        formattedPrice: "€30.00",
      },
      pricePerYear: {
        amount: 36500,
        amountMicros: 365000000,
        currency: "EUR",
        formattedPrice: "€365.00",
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
      pricePerWeek: null,
      pricePerMonth: null,
      pricePerYear: null,
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
        pricePerWeek: {
          amount: 692.31,
          amountMicros: 6923100,
          currency: "EUR",
          formattedPrice: "€6.92",
        },
        pricePerMonth: {
          amount: 3000,
          amountMicros: 30000000,
          currency: "EUR",
          formattedPrice: "€30.00",
        },
        pricePerYear: {
          amount: 36500,
          amountMicros: 365000000,
          currency: "EUR",
          formattedPrice: "€365.00",
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
        pricePerWeek: null,
        pricePerMonth: null,
        pricePerYear: null,
      },
    },
  },
  defaultNonSubscriptionOption: null,
};

const monthlyProduct300 = {
  identifier: "test_multicurrency_all_currencies",
  displayName: "Mario",
  title: "Mario",
  description:
    "Just the best for Italian supercalifragilisticexpialidocious plumbers, groom them on a monthly basis",
  productType: "subscription",
  currentPrice: {
    amount: 300,
    amountMicros: 3000000,
    currency: "EUR",
    formattedPrice: "€3.00",
  },
  price: {
    amount: 300,
    amountMicros: 3000000,
    currency: "EUR",
    formattedPrice: "€3.00",
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
      pricePerWeek: {
        amount: 210,
        amountMicros: 2100000,
        currency: "EUR",
        formattedPrice: "€2.10",
      },
      pricePerMonth: {
        amount: 900,
        amountMicros: 9000000,
        currency: "EUR",
        formattedPrice: "€9.00",
      },
      pricePerYear: {
        amount: 10950,
        amountMicros: 109500000,
        currency: "EUR",
        formattedPrice: "€109.50",
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
      pricePerWeek: {
        amount: 210,
        amountMicros: 2100000,
        currency: "EUR",
        formattedPrice: "€2.10",
      },
      pricePerMonth: {
        amount: 900,
        amountMicros: 9000000,
        currency: "EUR",
        formattedPrice: "€9.00",
      },
      pricePerYear: {
        amount: 10950,
        amountMicros: 109500000,
        currency: "EUR",
        formattedPrice: "€109.50",
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
        pricePerWeek: {
          amount: 210,
          amountMicros: 2100000,
          currency: "EUR",
          formattedPrice: "€2.10",
        },
        pricePerMonth: {
          amount: 900,
          amountMicros: 9000000,
          currency: "EUR",
          formattedPrice: "€9.00",
        },
        pricePerYear: {
          amount: 10950,
          amountMicros: 109500000,
          currency: "EUR",
          formattedPrice: "€109.50",
        },
      },
      trial: null,
    },
  },
  defaultNonSubscriptionOption: null,
};

const weeklyProduct600 = {
  identifier: "luigis_weekly",
  displayName: "Luigi Special",
  title: "Luigi Special",
  description: "A fresh alternative to the Mario's, clean them up every week",
  productType: "subscription",
  currentPrice: {
    amount: 600,
    amountMicros: 6000000,
    currency: "EUR",
    formattedPrice: "€6.00",
  },
  price: {
    amount: 600,
    amountMicros: 6000000,
    currency: "EUR",
    formattedPrice: "€6.00",
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
      pricePerWeek: {
        amount: 900,
        amountMicros: 9000000,
        currency: "EUR",
        formattedPrice: "€9.00",
      },
      pricePerMonth: {
        amount: 3912.27,
        amountMicros: 39122700,
        currency: "EUR",
        formattedPrice: "€39.12",
      },
      pricePerYear: {
        amount: 46947.32,
        amountMicros: 469473200,
        currency: "EUR",
        formattedPrice: "€469.47",
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
      pricePerWeek: {
        amount: 900,
        amountMicros: 9000000,
        currency: "EUR",
        formattedPrice: "€9.00",
      },
      pricePerMonth: {
        amount: 3912.27,
        amountMicros: 39122700,
        currency: "EUR",
        formattedPrice: "€39.12",
      },
      pricePerYear: {
        amount: 46947.32,
        amountMicros: 469473200,
        currency: "EUR",
        formattedPrice: "€469.47",
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
        pricePerWeek: {
          amount: 900,
          amountMicros: 9000000,
          currency: "EUR",
          formattedPrice: "€9.00",
        },
        pricePerMonth: {
          amount: 3912.27,
          amountMicros: 39122700,
          currency: "EUR",
          formattedPrice: "€39.12",
        },
        pricePerYear: {
          amount: 46947.32,
          amountMicros: 469473200,
          currency: "EUR",
          formattedPrice: "€469.47",
        },
      },
      trial: null,
    },
  },
  defaultNonSubscriptionOption: null,
};

const weeklyProduct208 = {
  identifier: "luigis_weekly",
  displayName: "Luigi Special",
  title: "Luigi Special",
  description: "A fresh alternative to the Mario's, clean them up every week",
  productType: "subscription",
  currentPrice: {
    amount: 208,
    amountMicros: 2080000,
    currency: "EUR",
    formattedPrice: "€2.08",
  },
  price: {
    amount: 208,
    amountMicros: 2080000,
    currency: "EUR",
    formattedPrice: "€2.08",
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
        amount: 208,
        amountMicros: 2080000,
        currency: "EUR",
        formattedPrice: "€2.08",
      },
      pricePerWeek: {
        amount: 208,
        amountMicros: 2080000,
        currency: "EUR",
        formattedPrice: "€2.08",
      },
      pricePerMonth: {
        amount: 900,
        amountMicros: 9000000,
        currency: "EUR",
        formattedPrice: "€9.00",
      },
      pricePerYear: {
        amount: 10800,
        amountMicros: 108000000,
        currency: "EUR",
        formattedPrice: "€108.00",
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
        amount: 208,
        amountMicros: 2080000,
        currency: "EUR",
        formattedPrice: "€2.08",
      },
      pricePerWeek: {
        amount: 208,
        amountMicros: 2080000,
        currency: "EUR",
        formattedPrice: "€2.08",
      },
      pricePerMonth: {
        amount: 900,
        amountMicros: 9000000,
        currency: "EUR",
        formattedPrice: "€9.00",
      },
      pricePerYear: {
        amount: 10800,
        amountMicros: 108000000,
        currency: "EUR",
        formattedPrice: "€108.00",
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
          amount: 208,
          amountMicros: 2080000,
          currency: "EUR",
          formattedPrice: "€2.08",
        },
        pricePerWeek: {
          amount: 208,
          amountMicros: 2080000,
          currency: "EUR",
          formattedPrice: "€2.08",
        },
        pricePerMonth: {
          amount: 900,
          amountMicros: 9000000,
          currency: "EUR",
          formattedPrice: "€9.00",
        },
        pricePerYear: {
          amount: 10800,
          amountMicros: 108000000,
          currency: "EUR",
          formattedPrice: "€108.00",
        },
      },
      trial: null,
    },
  },
  defaultNonSubscriptionOption: null,
};

const offering = {
  identifier: "MultiCurrencyTest",
  serverDescription: "Multi currency test Nicola",
  metadata: null,
  packagesById: {
    $rc_monthly: {
      identifier: "$rc_monthly",
      rcBillingProduct: monthlyProduct,
      webBillingProduct: monthlyProduct,
      packageType: "$rc_monthly",
    },
    $rc_weekly: {
      identifier: "$rc_weekly",
      rcBillingProduct: weeklyProduct,
      webBillingProduct: weeklyProduct,
      packageType: "$rc_weekly",
    },
    trial: {
      identifier: "trial",
      rcBillingProduct: trialProduct,
      webBillingProduct: trialProduct,
      packageType: "custom",
    },
  },
  availablePackages: [
    {
      identifier: "$rc_monthly",
      rcBillingProduct: monthlyProduct,
      webBillingProduct: monthlyProduct,
      packageType: "$rc_monthly",
    },
    {
      identifier: "$rc_weekly",
      rcBillingProduct: weeklyProduct,
      webBillingProduct: weeklyProduct,
      packageType: "$rc_weekly",
    },
    {
      identifier: "trial",
      rcBillingProduct: trialProduct,
      webBillingProduct: trialProduct,
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
    rcBillingProduct: monthlyProduct,
    webBillingProduct: monthlyProduct,
    packageType: "$rc_monthly",
  },
  weekly: {
    identifier: "$rc_weekly",
    rcBillingProduct: weeklyProduct,
    webBillingProduct: weeklyProduct,
    packageType: "$rc_weekly",
  },
  paywall_components: null,
} as unknown as Offering;

const samePricePackages = {
  identifier: "MultiCurrencyTest",
  serverDescription: "Multi currency test Nicola",
  metadata: null,
  packagesById: {
    $rc_monthly: {
      identifier: "$rc_monthly",
      rcBillingProduct: monthlyProduct,
      webBillingProduct: monthlyProduct,
      packageType: "$rc_monthly",
    },
    $rc_weekly: {
      identifier: "$rc_weekly",
      rcBillingProduct: weeklyProduct208,
      webBillingProduct: weeklyProduct208,
      packageType: "$rc_weekly",
    },
    trial: {
      identifier: "trial",
      rcBillingProduct: trialProduct900,
      webBillingProduct: trialProduct900,
      packageType: "custom",
    },
  },
  availablePackages: [
    {
      identifier: "$rc_monthly",
      rcBillingProduct: monthlyProduct,
      webBillingProduct: monthlyProduct,
      packageType: "$rc_monthly",
    },
    {
      identifier: "$rc_weekly",
      rcBillingProduct: weeklyProduct208,
      webBillingProduct: weeklyProduct208,
      packageType: "$rc_weekly",
    },
    {
      identifier: "trial",
      rcBillingProduct: trialProduct900,
      webBillingProduct: trialProduct900,
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
    rcBillingProduct: monthlyProduct,
    webBillingProduct: monthlyProduct,
    packageType: "$rc_monthly",
  },
  weekly: {
    identifier: "$rc_weekly",
    rcBillingProduct: weeklyProduct,
    webBillingProduct: weeklyProduct,
    packageType: "$rc_weekly",
  },
  paywall_components: null,
} as unknown as Offering;

const differentPricedPackages = {
  identifier: "MultiCurrencyTest",
  serverDescription: "Multi currency test Nicola",
  metadata: null,
  packagesById: {
    $rc_monthly: {
      identifier: "$rc_monthly",
      rcBillingProduct: monthlyProduct300,
      webBillingProduct: monthlyProduct300,
      packageType: "$rc_monthly",
    },
    $rc_weekly: {
      identifier: "$rc_weekly",
      rcBillingProduct: weeklyProduct600,
      webBillingProduct: weeklyProduct600,
      packageType: "$rc_weekly",
    },
    trial: {
      identifier: "trial",
      rcBillingProduct: trialProduct900,
      webBillingProduct: trialProduct900,
      packageType: "custom",
    },
  },
  availablePackages: [
    {
      identifier: "$rc_monthly",
      rcBillingProduct: monthlyProduct300,
      webBillingProduct: monthlyProduct300,
      packageType: "$rc_monthly",
    },
    {
      identifier: "$rc_weekly",
      rcBillingProduct: weeklyProduct600,
      webBillingProduct: weeklyProduct600,
      packageType: "$rc_weekly",
    },
    {
      identifier: "trial",
      rcBillingProduct: trialProduct900,
      webBillingProduct: trialProduct900,
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
    rcBillingProduct: monthlyProduct,
    webBillingProduct: monthlyProduct,
    packageType: "$rc_monthly",
  },
  weekly: {
    identifier: "$rc_weekly",
    rcBillingProduct: weeklyProduct,
    webBillingProduct: weeklyProduct,
    packageType: "$rc_weekly",
  },
  paywall_components: null,
} as unknown as Offering;

const enTranslator = new Translator({}, englishLocale);

describe("getPaywallVariables", () => {
  test("should return expected paywall variables", () => {
    expect(parseOfferingIntoVariables(offering, enTranslator)).toEqual(
      expect.objectContaining({
        $rc_monthly: expect.objectContaining({
          "product.store_product_name": "Mario",
          "product.price": "€9.00",
          "product.price_per_period_abbreviated": "€9.00/mo",
          "product.price_per_period": "€9.00/month",
          "product.period_with_unit": "1 month",
          "product.period_in_months": "1 month",
          "product.periodly": "monthly",
          "product.period": "month",
          "product.period_abbreviated": "mo",
          "product.price_per_month": "€9.00",
          "product.price_per_week": "€2.08",
          "product.relative_discount": "77% off",
        }),
        $rc_weekly: expect.objectContaining({
          "product.store_product_name": "Luigi Special",
          "product.price": "€9.00",
          "product.price_per_period_abbreviated": "€9.00/wk",
          "product.price_per_period": "€9.00/week",
          "product.period_with_unit": "1 week",
          "product.period_in_months": "1 week",
          "product.periodly": "weekly",
          "product.period": "week",
          "product.period_abbreviated": "wk",
          "product.price_per_month": "€38.97",
          "product.price_per_week": "€9.00",
          "product.relative_discount": "",
        }),
        trial: expect.objectContaining({
          "product.store_product_name": "Trial Mario",
          "product.price": "€30.00",
          "product.price_per_period_abbreviated": "€30.00/mo",
          "product.price_per_period": "€30.00/month",
          "product.period_with_unit": "1 month",
          "product.period_in_months": "1 month",
          "product.periodly": "monthly",
          "product.period": "month",
          "product.period_abbreviated": "mo",
          "product.price_per_month": "€30.00",
          "product.price_per_week": "€6.93",
          "product.relative_discount": "23% off",
        }),
      }),
    );
  });
  test("sub_relative_discount is calculated correctly for same-priced packages", () => {
    /**
     * Monthly: 9€/month
     * Weekly: 2.08€/week - 9€/month
     * Trial: 9€/month after trial
     */
    const variables = parseOfferingIntoVariables(
      samePricePackages,
      enTranslator,
    );
    Object.values(variables).forEach((variable) =>
      expect(variable["product.relative_discount"]).toBe(""),
    );
  });
  test("sub_relative_discount is calculated correctly for two packages with the same price", () => {
    /**
     * Monthly: 3€/month = 88%off
     * Weekly: 6€/week - 25.98€/month - most expensive
     * Trial: 9€/month after trial = 65%off
     */
    const expectedValues = ["88% off", "", "65% off"];

    const variables = parseOfferingIntoVariables(
      differentPricedPackages,
      enTranslator,
    );

    Object.values(variables).forEach((variable, idx) => {
      expect(variable["product.relative_discount"]).toBe(expectedValues[idx]);
    });
  });
});
