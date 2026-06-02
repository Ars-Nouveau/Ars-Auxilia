export type Addon = string;

export type AddonMap = Record<string, { text: string }>;

export const getAddonFromNamespace = (namespace: string): Addon | undefined =>
  namespace === "ars_nouveau" ? undefined : namespace;
