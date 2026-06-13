import { type ChatInputCommandInteraction, type User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

import { InfoCommand } from "../../abstracts/info-command.js";
import { userSlashOption } from "../../util/interaction.js";

@Discord()
export class SourceCommand extends InfoCommand {
  description = "Links and information about Source Librarian";
  title = "Source Librarian";
  url = "https://github.com/Ars-Nouveau/Ars-Auxilia";
  lines = [
    "Source Librarian is an open-source Discord bot for the Ars Nouveau community.",
    "The source code lives in a monorepo for out-of-game tools, with the bot itself located under [`/apps/source-librarian`](https://github.com/Ars-Nouveau/Ars-Auxilia/tree/main/apps/source-librarian).",
  ];
  fields = [
    {
      name: "Contributing",
      value: "Pull requests and issues are welcome on the [GitHub repository](https://github.com/Ars-Nouveau/Ars-Auxilia).",
    },
  ];

  @Slash({ name: "source", description: "Links and information about Source Librarian" })
  override async run(
    @SlashOption(userSlashOption)
    user: User | undefined,
    interaction: ChatInputCommandInteraction,
  ) {
    await super.run(user, interaction);
  }
}
