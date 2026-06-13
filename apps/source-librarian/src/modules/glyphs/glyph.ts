import { getGlyphRenderUrl } from "@ars/addon-builder";
import { toTitleCase } from "@ars/types";
import {
  type APIEmbedField,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandStringOption,
  type User,
} from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { getGlyphs, getLang, searchGlyphs } from "../../util/glyphs.js";
import {
  getEphemeral,
  getMention,
  userSlashOption,
} from "../../util/interaction.js";

const nameOption = new SlashCommandStringOption()
  .setName("name")
  .setDescription("Glyph name")
  .setRequired(true)
  .setAutocomplete(true);

@Discord()
export class GlyphCommand {
  @Slash({ name: "glyph", description: "Look up details for a glyph" })
  async run(
    @SlashOption(nameOption)
    name: string,
    @SlashOption(userSlashOption)
    user: User | undefined,
    interaction: ChatInputCommandInteraction | AutocompleteInteraction,
  ) {
    if (interaction.isAutocomplete()) {
      return this.autocomplete(interaction);
    }

    const glyphs = await getGlyphs();
    const glyph = glyphs[name];

    if (!glyph) {
      await interaction.reply({
        content: "Glyph not found.",
        flags: getEphemeral(interaction),
      });
      return;
    }

    const lang = await getLang();
    const typeName = lang[glyph.typeName.translate] ?? glyph.typeName.translate;
    const descKey = glyph.localizationKey.replace("glyph_name", "glyph_desc");
    const description = [
      lang[descKey] ?? descKey
    ];

    const { defaults } = glyph;

    const fields: APIEmbedField[] = [];

    fields.push({ name: "Tier", value: String(defaults.tier), inline: true });
    fields.push({ name: "Cost", value: String(defaults.cost), inline: true });

    if (!defaults.enabled) {
      fields.push({ name: "Enabled", value: "No", inline: true });
    }

    if (defaults.perSpellLimit !== 2147483647) {
      fields.push({
        name: "Per-Spell Limit",
        value: String(defaults.perSpellLimit),
        inline: true,
      });
    }

    if (glyph.spellSchools.length > 0) {
      fields.push({
        name: "Schools",
        value: glyph.spellSchools.map((s) => toTitleCase(s.id)).join(", "),
      });
    }

    const config = defaults.defaultConfig;
    const configLines: string[] = [];
    if (config.baseDamage != null)
      configLines.push(`Base Damage: ${config.baseDamage}`);
    if (config.ampDamage != null)
      configLines.push(`Amp Damage: ${config.ampDamage}`);
    if (config.baseDuration != null)
      configLines.push(`Base Duration: ${config.baseDuration}`);
    if (config.ampDuration != null)
      configLines.push(`Amp Duration: ${config.ampDuration}`);

    if (configLines.length > 0) {
      fields.push({ name: "Default Config", value: configLines.join("\n") });
    }

    if (defaults.augments.compatible.length > 0) {
      const augmentLines: string[] = [];

      for (const augId of defaults.augments.compatible) {
        const augGlyph = glyphs[augId];
        const displayName = augGlyph?.name ?? augId;

        if (!(augId in defaults.augments.descriptions)) continue;
        const descKey = defaults.augments.descriptions[augId].translate;
        const description = lang[descKey] ?? descKey;

        augmentLines.push(
          `**${displayName}:** ${description}`
        );
      }

      if (augmentLines.length > 0) {
        description.push("");
        description.push(...augmentLines);
      }
    }

    const embed = new EmbedBuilder({
      title: `**${typeName}:** ${glyph.name}`,
      color: 0x231631,
      thumbnail: { url: getGlyphRenderUrl(glyph) },
      fields,
      description: description.join("\n")
    });

    await interaction.reply({
      content: getMention(interaction),
      embeds: [embed],
      flags: getEphemeral(interaction),
    });
  }

  private async autocomplete(interaction: AutocompleteInteraction) {
    try {
      const focused = interaction.options.getFocused();
      const results = await searchGlyphs(focused);

      await interaction.respond(
        results.map(([id, glyph]) => ({
          name: glyph.name,
          value: id,
        })),
      );
    } catch {
      await interaction.respond([]);
    }
  }
}
