import type { WorkflowData, WorkflowStep } from "@revenuecat/purchases-ui-js";

export type { WorkflowStep };

export interface WorkflowSummary {
  id: string;
  display_name: string;
  offering_id: string | null;
  prefetch: boolean;
}

export interface WorkflowsListResponse {
  workflows: WorkflowSummary[];
  ui_config: Record<string, unknown>;
}

export type WorkflowDataResponse = WorkflowData;

interface WorkflowUseCDNAction {
  action: "use_cdn";
  url: string;
}

interface WorkflowInlineAction {
  action: "inline";
  data: WorkflowDataResponse;
}

export type WorkflowDataAction = WorkflowUseCDNAction | WorkflowInlineAction;
