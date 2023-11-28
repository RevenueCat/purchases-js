import type { Meta, StoryObj } from "@storybook/svelte";
import PaymentModal from "../ui/rcb-ui.svelte";

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

export const Default: Story = {
  args: {
    environment: "production",
  },
};

export const Sandbox: Story = {
  args: {
    environment: "sandbox",
  },
};
