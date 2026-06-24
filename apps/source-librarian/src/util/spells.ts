import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { dirname, resolve } from "@discordx/importer";
import { parse } from "smol-toml";

export interface SpellLink {
  url: string;
  /** Masked-link label. Omit to render the bare (auto-linked) URL. */
  text?: string;
  /** Trailing annotation, e.g. version/addon support. */
  note?: string;
}

export interface SpellSection {
  /** Heading. Named sections become embed fields; nameless ones the description. */
  name?: string;
  description?: string;
  links?: SpellLink[];
}

export interface Spell {
  name: string;
  sections: SpellSection[];
}

const files = await resolve(
  `${dirname(import.meta.url)}/../content/spellcrafting/*.toml`,
);

export const spells: Record<string, Spell> = Object.fromEntries(
  await Promise.all(
    files.map(async (file) => {
      const slug = basename(file, ".toml");
      const spell = parse(
        await readFile(new URL(file), "utf8"),
      ) as unknown as Spell;
      return [slug, spell] as const;
    }),
  ),
);
