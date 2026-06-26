export type ExportedGlyph = {
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

export type Component = {
  translate: string;
};

export type SpellSchool = {
  id: string;
  subschools: string[];
};

export type Defaults = {
  starter: boolean;
  perSpellLimit: number;
  augments: Augments;
  invalidCombinations: string[];
  defaultConfig?: Configs;
  tier: number;
  cost: number;
  enabled: boolean;
};

export type Augments = {
  compatible: string[];
  descriptions: { [id: string]: Component };
  costs: { [id: string]: number };
  limits: { [id: string]: number };
};

export type Configs = {
  baseDamage?: number;
  ampDamage?: number;
  baseDuration?: number;
  ampDuration?: number;
};
