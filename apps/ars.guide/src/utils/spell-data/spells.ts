import type { Category } from "./categories.ts";
import type { Addon } from "./addons.ts";
import type { Version } from "../versions.ts";

export interface Spell {
  glyphs: string[];
  description: string;
  spell_color?: SpellColor;
  spell_sound?: string | SpellSound;
  style?: Record<string, any>;
}

export interface SpellColor {
  id: string;
  r: number;
  g: number;
  b: number;
}

export interface SpellSound {
  id: string;
  pitch: number;
  volume: number;
}

export interface Submission {
  name: string;
  category: Category;
  author: string;
  userId?: string;
  versions: Version[];
  addons: Addon[];
  spells: Spell[];
}
