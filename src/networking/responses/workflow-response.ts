import type { WorkflowData, WorkflowStep } from "@revenuecat/purchases-ui-js";

export type { WorkflowStep };

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
