import { ServerResponse } from "./offerings";

export interface Entitlement {}

export const toEntitlement = (data: ServerResponse) => {
  return data as Entitlement;
};
