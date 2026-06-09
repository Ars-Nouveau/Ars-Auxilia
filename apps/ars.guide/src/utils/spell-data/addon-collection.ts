import { getCollection } from "astro:content";
import type { AddonMap } from "./addons";

export const getAddonMap = async (): Promise<AddonMap> => {
  const projects = await getCollection("projects");
  return Object.fromEntries(
    projects.map((p) => [p.id, { text: p.data.display_name }]),
  );
};
