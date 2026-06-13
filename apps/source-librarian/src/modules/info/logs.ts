import { type ChatInputCommandInteraction, type User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

import { InfoCommand } from "../../abstracts/info-command.js";
import { userSlashOption } from "../../util/interaction.js";

@Discord()
export class LogsCommand extends InfoCommand {
  description = "How to share logs";
  title = ":notepad_spiral: Log Sharing";
  lines = [
    "Upload your log file to [mclo.gs](https://mclo.gs/) so that people can help easier, not everyone is on their PC all the time and having a easily formatted searchable link is much easier for debugging.",
  ];
  fields = [
    {
      name: "Where can I find my logs?",
      value:
        "Go to your instance or .minecraft folder and upload the logs/latest.log file",
    },
    {
      name: "How about crash reports?",
      value:
        "Crash reports can be found in your instance or .minecraft folder under the crash-reports sub-folder. This is only made when a crash is registered, so if it doesn't exist that's fine.",
    },
  ];

  @Slash({ name: "logs", description: "How to share logs" })
  override async run(
    @SlashOption(userSlashOption)
    user: User | undefined,
    interaction: ChatInputCommandInteraction,
  ) {
    await super.run(user, interaction);
  }
}
