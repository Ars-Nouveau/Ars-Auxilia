import { getEntry } from "astro:content";
import type { AddonMap } from "./addons";

export const getAddonMap = async (): Promise<AddonMap> => {
  const entry = await getEntry("namespaces", "namespaces");
  return entry?.data ?? {};
};
