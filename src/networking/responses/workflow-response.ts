import type { WorkflowData, WorkflowStep } from "@revenuecat/purchases-ui-js";

export type { WorkflowStep };

/**
 * Response from GET /workflows/v1/workflow/{workflowLinkId}.
 * Returns the public API key and a workflow_url template for the subscriber
 * fetch (step 2). The workflow_url contains `{app_user_id}` as a placeholder.
 */
export interface WorkflowMetadataResponse {
  api_key: string;
  workflow_url: string;
  workflow_id: string;
}

/**
 * A screen (paywall) configuration within a workflow.
 */
export interface WorkflowScreen {
  name: string;
  template_name: string;
  revision: number;
  asset_base_url: string;
  components_config: Record<string, unknown>;
  components_localizations: Record<string, Record<string, string>>;
  default_locale: string;
  config: Record<string, unknown>;
  offering_id: string | null;
  offering_identifier: string | null;
  automatically_scale_font_size: boolean | null;
  exit_offers: Record<string, unknown>;
}

/**
 * A lightweight workflow summary returned by the list endpoint.
 */
export interface WorkflowSummary {
  id: string;
  display_name: string;
  offering_id: string | null;
  prefetch: boolean;
}

/**
 * Response from GET /v1/subscribers/{appUserId}/workflows.
 */
export interface WorkflowsListResponse {
  workflows: WorkflowSummary[];
  ui_config: Record<string, unknown>;
}

/**
 * Response from GET {workflow_url} — the full workflow payload.
 * Re-uses WorkflowData from @revenuecat/purchases-ui-js to avoid duplication.
 */
export type WorkflowDataResponse = WorkflowData;

/**
 * Redirect to a CDN-hosted workflow payload.
 */
interface WorkflowUseCDNAction {
  action: "use_cdn";
  url: string;
}

/**
 * Inline workflow payload (no CDN redirect).
 */
interface WorkflowInlineAction {
  action: "inline";
  data: WorkflowDataResponse;
}

export type WorkflowDataAction = WorkflowUseCDNAction | WorkflowInlineAction;
