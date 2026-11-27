/**
 * A flow step or paywall lifecycle event, as passed to `PaywallListener.onFlowEvent`. Keys that do not
 * apply are omitted.
 *
 * A flow is the whole paywall experience, from one step to many. A paywall shown without a flow
 * reports only `paywall_impression` and `paywall_close`.
 * @public
 */
export interface FlowEvent {
  /** One of {@link FLOW_EVENT_TYPES}. */
  readonly event_type: string;
  readonly timestamp: number;
  readonly trace_id?: string;
  readonly flow_id?: string;
  readonly flow_name?: string;
  readonly step_id?: string;
  readonly step_type?: string;
  readonly screen_type?: readonly string[];
  readonly screen_name?: string;
  readonly locale?: string;
  readonly from_step_id?: string;
  readonly to_step_id?: string;
  readonly entry_reason?: string;
  readonly is_first_step?: boolean;
  readonly is_last_step?: boolean;
  readonly paywall_id?: string;
  readonly offering_id?: string;
  readonly paywall_revision?: number;
  readonly session_id?: string;
  readonly display_mode?: string;
  readonly dark_mode?: boolean;
}

/**
 * Property keys for a {@link FlowEvent}.
 * @public
 */
export const FLOW_EVENT_KEYS = {
  EVENT_TYPE: "event_type",
  TIMESTAMP: "timestamp",
  TRACE_ID: "trace_id",
  FLOW_ID: "flow_id",
  FLOW_NAME: "flow_name",
  STEP_ID: "step_id",
  STEP_TYPE: "step_type",
  SCREEN_TYPE: "screen_type",
  SCREEN_NAME: "screen_name",
  LOCALE: "locale",
  FROM_STEP_ID: "from_step_id",
  TO_STEP_ID: "to_step_id",
  ENTRY_REASON: "entry_reason",
  IS_FIRST_STEP: "is_first_step",
  IS_LAST_STEP: "is_last_step",
  PAYWALL_ID: "paywall_id",
  OFFERING_ID: "offering_id",
  PAYWALL_REVISION: "paywall_revision",
  SESSION_ID: "session_id",
  DISPLAY_MODE: "display_mode",
  DARK_MODE: "dark_mode",
} as const satisfies Record<string, keyof FlowEvent>;

/**
 * Known values of `event_type` in {@link FlowEvent}.
 * @public
 */
export const FLOW_EVENT_TYPES = {
  FLOW_STEP_STARTED: "flow_step_started",
  FLOW_STEP_COMPLETED: "flow_step_completed",
  FLOW_CLOSE: "flow_close",
  PAYWALL_IMPRESSION: "paywall_impression",
  PAYWALL_CLOSE: "paywall_close",
} as const;
