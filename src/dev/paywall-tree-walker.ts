import type { PaywallData } from "@revenuecat/purchases-ui-js";

export interface WalkEntry {
  id: string;
  type: string;
  name?: string;
  /**
   * The original component node from the paywall data. Optional; consumers that
   * only need id/type/name (e.g., the DOM layout reader) don't need to provide it.
   */
  node?: unknown;
}

// Minimal local shape aliases to avoid importing unexported subpaths from the
// purchases-ui-js package.  Each interface mirrors only the fields we read.

interface HasId {
  id: string;
  type: string;
  name?: string;
}

interface StackLike extends HasId {
  type: "stack";
  components?: ComponentLike[];
  badge?: { stack: StackLike } | null;
}

interface ComponentLike extends HasId {
  // child stacks present on wrapping component types
  stack?: StackLike;
  // tabs
  control?: { stack: StackLike };
  tabs?: Array<HasId & { stack: StackLike }>;
  // carousel
  pages?: StackLike[];
  // timeline
  items?: Array<
    HasId & {
      icon?: HasId;
      title?: HasId;
      description?: HasId | null;
    }
  >;
  // stack children
  components?: ComponentLike[];
}

export function* walkPaywallTree(
  paywallData: PaywallData,
): Generator<WalkEntry, void, void> {
  const root = paywallData.components_config.base;
  yield* walkStack(root.stack as unknown as StackLike);
  if (root.sticky_footer) {
    yield* walkComponent(root.sticky_footer as unknown as ComponentLike);
  }
}

function* walkComponent(node: ComponentLike): Generator<WalkEntry, void, void> {
  yield { id: node.id, type: node.type, name: node.name, node };

  switch (node.type) {
    case "stack":
      yield* walkStackChildren(node as StackLike);
      break;

    // Every button-family component wraps a `stack` that may contain its own
    // nested components (icon + label, etc.). Without descending into
    // `node.stack` for these types, any dashboard ID inside a button is
    // invisible to the extractor — which then shows up as a coverage gap
    // when comparing against iOS/Android.
    case "footer":
    case "package":
    case "button":
    case "purchase_button":
    case "wallet_button":
    case "redemption_button":
    case "express_purchase_button":
      if (node.stack) {
        yield* walkStack(node.stack);
      }
      break;

    case "tabs":
      // TabControl is a structural wrapper without an `id`; only its inner
      // stack is walked.
      if (node.control?.stack) {
        yield* walkStack(node.control.stack);
      }
      if (node.tabs) {
        for (const tab of node.tabs) {
          yield { id: tab.id, type: tab.type, name: tab.name, node: tab };
          yield* walkStack(tab.stack as StackLike);
        }
      }
      break;

    case "carousel":
      if (node.pages) {
        for (const page of node.pages) {
          yield* walkStack(page);
        }
      }
      break;

    case "timeline":
      if (node.items) {
        for (const item of node.items) {
          yield { id: item.id, type: item.type, name: item.name, node: item };
          if (item.icon) yield* walkComponent(item.icon as ComponentLike);
          if (item.title) yield* walkComponent(item.title as ComponentLike);
          if (item.description)
            yield* walkComponent(item.description as ComponentLike);
        }
      }
      break;

    default:
      break;
  }
}

function* walkStack(stack: StackLike): Generator<WalkEntry, void, void> {
  yield* walkComponent(stack as ComponentLike);
}

function* walkStackChildren(
  stack: StackLike,
): Generator<WalkEntry, void, void> {
  for (const child of stack.components ?? []) {
    yield* walkComponent(child);
  }
  if (stack.badge) {
    yield* walkStack(stack.badge.stack);
  }
}
