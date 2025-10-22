export type RightCode = number;

export type GeneralRights = RightCode[];

export type Right = {
  id_diritto: number;
  descrizione_breve: string;
  descrizione_lunga: string;
};

export type RightsPayload = {
  generalRoles: number[];
  rights: Right[];
};
