import type { Loader } from "astro/loaders";
import { fetchManifestFile, getAssetManifest } from "./asset-manifest";

export function glyphLoader() {
  return {
    name: "glyph-loader",
    load: async ({ store, parseData }) => {
      store.clear();

      const manifest = await getAssetManifest();
      const body = await fetchManifestFile<Record<string, ExportedGlyph>>(
        manifest.glyphs,
      );

      for (const [key, glyph] of Object.entries(body) as [
        string,
        ExportedGlyph,
      ][]) {
        const id = key.replace("glyph_", "");
        const data = await parseData({
          id,
          data: glyph,
        });
        store.set({
          id,
          data,
        });
      }
    },
  } satisfies Loader;
}

type ExportedGlyph = {
  typeName: Component;
  typeIndex: number;
  classes: string[];
  spellSchools: SpellSchool[];
  defaults: Defaults;
  name: string;
  texture: string;
  animated: boolean;
  registryName: string;
  localizationKey: string;
};

type Component = {
  translate: string;
};

type SpellSchool = {
  id: string;
  subschools: string[];
};

type Defaults = {
  starter: boolean;
  perSpellLimit: number;
  augments: Augments;
  invalidCombinations: string[];
  defaultConfig: Configs;
  tier: number;
  cost: number;
  enabled: boolean;
};

type Augments = {
  compatible: string[];
  descriptions: { [id: string]: Component };
  costs: { [id: string]: number };
  limits: { [id: string]: number };
};

type Configs = {
  baseDamage?: number;
  ampDamage?: number;
  baseDuration?: number;
  ampDuration?: number;
};
