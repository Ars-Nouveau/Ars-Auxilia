import {
  type APIEmbedField,
  ApplicationCommandOptionType,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  type User,
} from "discord.js";
import { Discord, Slash, SlashChoice, SlashOption } from "discordx";

import {
  getEphemeral,
  getMention,
  userSlashOption,
} from "../../util/interaction.js";
import { type SpellLink, spells } from "../../util/spells.js";

const EMBED_COLOR = 0x231631;

const choices = Object.entries(spells).map(([slug, spell]) => ({
  name: spell.name,
  value: slug
}));

function renderLinks(links?: SpellLink[]): string {
  return (
    links
      ?.map((link) => {
        const label = link.text ? `[${link.text}](${link.url})` : link.url;
        return link.note ? `- ${label} - ${link.note}` : `- ${label}`;
      })
      .join("\n") ?? ""
  );
}

@Discord()
export class SpellcraftingCommand {
  @Slash({
    name: "spellcrafting",
    description: "Spellcrafting Information & Quick-Links",
  })
  async spellcrafting(
    @SlashChoice(...choices)
    @SlashOption({ description: 'Spellcrafting category to show', name: 'category', required: true, type: ApplicationCommandOptionType.String })
    slug: string,
    @SlashOption(userSlashOption)
    _user: User | undefined,
    interaction: ChatInputCommandInteraction,
  ) {
    const spell = spells[slug];
    if (!spell) {
      await interaction.reply({
        content: "Unknown spell.",
        flags: getEphemeral(interaction),
      });
      return;
    }

    const description: string[] = [];
    const fields: APIEmbedField[] = [];

    for (const section of spell.sections) {
      const value = [section.description, renderLinks(section.links)]
        .filter(Boolean)
        .join("\n");
      if (!value) continue;
      if (section.name) fields.push({ name: section.name, value });
      else description.push(value);
    }

    const embed = new EmbedBuilder({
      title: spell.name,
      color: EMBED_COLOR,
      description: description.join("\n\n") || undefined,
      fields: fields.length ? fields : undefined,
    });

    await interaction.reply({
      content: getMention(interaction) || undefined,
      embeds: [embed],
      flags: getEphemeral(interaction),
    });
  }
}
