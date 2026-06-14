import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandStringOption,
  type User,
} from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import { searchGuide, stripHighlight } from "../../util/guide.js";
import {
  getEphemeral,
  getMention,
  userSlashOption,
} from "../../util/interaction.js";

const queryOption = new SlashCommandStringOption()
  .setName("query")
  .setDescription("Search query")
  .setRequired(true);

@Discord()
@SlashGroup("guide")
export class GuideDocsCommand {
  @Slash({ name: "docs", description: "Search the documentation" })
  async run(
    @SlashOption(queryOption)
    query: string,
    @SlashOption(userSlashOption)
    user: User | undefined,
    interaction: ChatInputCommandInteraction,
  ) {
    await interaction.deferReply({ flags: getEphemeral(interaction) });

    const results = await searchGuide(query, "docs");

    if (results.length === 0) {
      await interaction.editReply({ content: "No results found." });
      return;
    }

    const fields = results.map((r) => ({
      name: r.title,
      value: `${stripHighlight(r.excerpt)}\n[Read more](${r.url})`,
    }));

    const embed = new EmbedBuilder({
      title: `Docs results for "${query}"`,
      color: 0x231631,
      fields,
    });

    await interaction.editReply({
      content: getMention(interaction),
      embeds: [embed],
    });
  }
}

