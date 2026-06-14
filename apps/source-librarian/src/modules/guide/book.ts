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
@SlashGroup({ description: "Search the guide", name: "guide" })
@SlashGroup("guide")
export class GuideBookCommand {
  @Slash({ name: "book", description: "Search the in-game book" })
  async run(
    @SlashOption(queryOption)
    query: string,
    @SlashOption(userSlashOption)
    user: User | undefined,
    interaction: ChatInputCommandInteraction,
  ) {
    await interaction.deferReply({ flags: getEphemeral(interaction) });

    const results = await searchGuide(query, "book");

    if (results.length === 0) {
      await interaction.editReply({ content: "No results found." });
      return;
    }

    const [result] = results;

    const mention = getMention(interaction);
    const content = `${mention ? `${mention} ` : ""}${result.url}`;

    await interaction.editReply({
      content,
    });
  }
}
