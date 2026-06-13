import { type ChatInputCommandInteraction, type User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

import { InfoCommand } from "../../abstracts/info-command.js";
import { userSlashOption } from "../../util/interaction.js";

@Discord()
export class EnchantingCommand extends InfoCommand {
  title = "Enchanting Apparatus";
  image = "https://i.imgur.com/88FE6iD.png";
  lines = [
    "Oops, it looks like you've used an Imbuement Chamber instead of an Enchanting Apparatus",
  ];
  description = `Instructions for when a user should be using an ${this.title}`;

  @Slash({ name: "enchanting", description: "Instructions for when a user should be using an Enchanting Apparatus" })
  override async run(
    @SlashOption(userSlashOption)
    user: User | undefined,
    interaction: ChatInputCommandInteraction,
  ) {
    await super.run(user, interaction);
  }
}
