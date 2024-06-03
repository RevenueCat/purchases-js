// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import type { StoryObj } from "@storybook/svelte";
import { type Meta } from "@storybook/svelte";
import PaymentModal from "../ui/rcb-ui.svelte";
import { PackageType, Purchases } from "../main";
import { Backend } from "../networking/backend";
import { type Package } from "../entities/offerings";

const sandboxApiKey = "rcb_sb_some_unique_key";
const sandboxBackend = new Backend(sandboxApiKey);

const sandboxPurchases = Purchases.configure(
  sandboxApiKey,
  "some_user_testing",
);

const prodApiKey = "rcb_some_unique_key";
const prodBackend = new Backend(prodApiKey);

const prodPurchases = Purchases.configure(prodApiKey, "some_user_testing");

const meta = {
  title: "Example/PaymentModal",
  component: PaymentModal,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ["autodocs"],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/svelte/configure/story-layout
    layout: "fullscreen",
  },
} satisfies Meta<PaymentModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const packageWithDefaultOption: Package = {
  identifier: "some_package_123",
  rcBillingProduct: {
    identifier: "some_product_123",
    displayName: "Some Product 123",
    currentPrice: {
      amount: 999,
      currency: "USD",
      formattedPrice: "9.99$",
    },
    normalPeriodDuration: "P1M",
    presentedOfferingIdentifier: "some_offering_identifier",
    defaultSubscriptionPurchaseOptionId: "base_option",
    subscriptionPurchaseOptions: {
      base_option: {
        basePhase: {
          periodDuration: "P1M",
          price: {
            amount: 999,
            currency: "USD",
            formattedPrice: "9.99$",
          },
          cycleCount: 0,
        },
      },
    },
  },
  packageType: PackageType.Monthly,
} as Package;

export const Default: Story = {
  args: {
    environment: "production",
    purchases: prodPurchases,
    backend: prodBackend,
    rcPackage: packageWithDefaultOption,
  },
};

export const Sandbox: Story = {
  args: {
    environment: "sandbox",
    purchases: sandboxPurchases,
    backend: sandboxBackend,
    rcPackage: packageWithDefaultOption,
  },
};
