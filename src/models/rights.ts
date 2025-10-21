export type RightCode = number;

export type GeneralRights = RightCode[];

export type FlowRights = {
  flowId: number;
  flowCode?: number;
  rights: RightCode[];
};

export type RightsPayload = {
  generalRoles: number[];

  flows: FlowRights[];
};
