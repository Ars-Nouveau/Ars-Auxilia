import {
  type ChatInputCommandInteraction,
  SlashCommandStringOption,
  type User,
} from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import { searchGuide } from "../../util/guide.js";
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

    const results = await searchGuide(query, "docs", undefined, 3);

    if (results.length === 0) {
      await interaction.editReply({ content: "No results found." });
      return;
    }

    const links = results
      .map((r) => `- [${r.title}](${r.url})`)
      .join("\n");

    await interaction.editReply({
      content: [getMention(interaction), links].filter(Boolean).join("\n"),
    });
  }
}

