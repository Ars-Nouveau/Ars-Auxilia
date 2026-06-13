import { type ChatInputCommandInteraction, type User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

import { InfoCommand } from "../../abstracts/info-command.js";
import { userSlashOption } from "../../util/interaction.js";

@Discord()
export class ImbuementCommand extends InfoCommand {
  title = "Imbuement Chamber";
  image = "https://i.imgur.com/3YG8c6e.png";
  lines = [
    "Oops, it looks like you've used an Enchanting Apparatus instead of an Imbuement Chamber",
  ];
  description = `Instructions for when a user should be using an ${this.title}`;

  @Slash({ name: "imbuement", description: "Instructions for when a user should be using an Imbuement Chamber" })
  override async run(
    @SlashOption(userSlashOption)
    user: User | undefined,
    interaction: ChatInputCommandInteraction,
  ) {
    await super.run(user, interaction);
  }
}
