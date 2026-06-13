import { ApplicationCommandOptionType, type ChatInputCommandInteraction, type User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

import { getEphemeral, getMention, userSlashOption } from "../../util/interaction.js";

@Discord()
export class LmgtfyCommand {
  @Slash({ name: "lmgtfy", description: "When a user needs help finding Google" })
  async run(
    @SlashOption({
      name: "query",
      description: "What should be googled?",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    query: string,
    @SlashOption(userSlashOption)
    _user: User | undefined,
    interaction: ChatInputCommandInteraction,
  ) {
    const mention = getMention(interaction);
    const url = `https://letmegooglethat.com/?q=${encodeURIComponent(query)}`;
    const content = mention ? `${mention}\n[${query}](<${url}>)` : `[${query}](<${url}>)`;

    await interaction.reply({
      content,
      flags: getEphemeral(interaction),
    });
  }
}
