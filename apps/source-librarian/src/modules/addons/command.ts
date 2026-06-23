import {
  type APIEmbedField,
  type AutocompleteInteraction,
  channelMention,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  time,
  TimestampStyles,
  type User,
} from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";

import { addonAutocomplete, addons, addonSlashOption } from "../../util/addons.js";
import { getAddonMod } from "../../util/curseforge.js";
import {
  getEphemeral,
  getMention,
  userSlashOption,
} from "../../util/interaction.js";

const EMBED_COLOR = 0x231631;
const FIELD_VALUE_LIMIT = 1024;

@Discord()
@SlashGroup({ description: "Information about Ars addons", name: "addons" })
@SlashGroup("addons")
export class AddonsCommand {
  @Slash({ name: "info", description: "Information about an Ars addon" })
  async info(
    @SlashOption(addonSlashOption)
    id: string,
    @SlashOption(userSlashOption)
    _user: User | undefined,
    interaction: ChatInputCommandInteraction | AutocompleteInteraction,
  ) {
    if (interaction.isAutocomplete()) {
      return addonAutocomplete(interaction);
    }

    const addon = addons[id];
    if (!addon) {
      await interaction.reply({
        content: "Unknown addon.",
        flags: getEphemeral(interaction),
      });
      return;
    }

    await interaction.deferReply({ flags: getEphemeral(interaction) });

    const mod = await getAddonMod(addon.id);
    if (!mod) {
      await interaction.editReply({ content: "Unable to retrieve addon data." });
      return;
    }

    const versions =
      mod.versions.map((v) => `- [${v.name}](${v.link})`).join("\n") ||
      "Unknown";

    const fields: APIEmbedField[] = [
      {
        name: "Supported Versions",
        value:
          versions.length > FIELD_VALUE_LIMIT
            ? `${versions.slice(0, FIELD_VALUE_LIMIT - 1)}…`
            : versions,
      },
      {
        name: "Last Updated",
        value: time(mod.last_updated, TimestampStyles.RelativeTime),
        inline: true,
      },
      {
        name: "Downloads",
        value: mod.download_count.toLocaleString(),
        inline: true,
      },
    ];

    if (mod.issues) fields.push({ name: "Issues", value: mod.issues });
    if (mod.source) fields.push({ name: "Source", value: mod.source });
    if (addon.channel) {
      fields.push({ name: "Discussion", value: channelMention(addon.channel) });
    }

    const embed = new EmbedBuilder({
      title: `${mod.name} by ${mod.author}`,
      color: EMBED_COLOR,
      description: mod.summary,
      url: mod.link,
      thumbnail: mod.logo ? { url: mod.logo } : undefined,
      fields,
    });

    await interaction.editReply({
      content: getMention(interaction) || undefined,
      embeds: [embed],
    });
  }

  @Slash({
    name: "discussion",
    description: "Discussion channel for a specific Ars addon",
  })
  async discussion(
    @SlashOption(addonSlashOption)
    id: string,
    @SlashOption(userSlashOption)
    _user: User | undefined,
    interaction: ChatInputCommandInteraction | AutocompleteInteraction,
  ) {
    if (interaction.isAutocomplete()) {
      return addonAutocomplete(interaction);
    }

    const addon = addons[id];
    if (!addon) {
      await interaction.reply({
        content: "Unknown addon.",
        flags: getEphemeral(interaction),
      });
      return;
    }

    if (!addon.channel) {
      await interaction.reply({
        content: "No discussion channel found.",
        flags: getEphemeral(interaction),
      });
      return;
    }

    const mention = getMention(interaction);
    await interaction.reply({
      content: `${mention}${channelMention(addon.channel)}`,
      flags: getEphemeral(interaction),
    });
  }
}
