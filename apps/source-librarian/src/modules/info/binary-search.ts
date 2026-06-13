import { type ChatInputCommandInteraction, type User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

import { InfoCommand } from "../../abstracts/info-command.js";
import { userSlashOption } from "../../util/interaction.js";

@Discord()
export class BinarySearchCommand extends InfoCommand {
  description = "How to debug mod issues with a binary search";
  title = ":mag: Binary Search for Mod Issues";
  lines = [
    "Binary searching your mods lets you find the offending mod faster than disabling them one by one.",
    "1. Make a backup of your instance so you can restore it later.",
    "2. Disable or move half of your mods and then reproduce the issue.",
    "3. If the issue still happens, the broken mod is in the enabled half. Otherwise, it's in the disabled half.",
    "4. Repeat the process with the half that still has the issue until you narrow it down to a single mod.",
  ];
  fields = [
    {
      name: "Keep dependencies together",
      value:
        "If a mod depends on others, move the whole group together so you don't create new errors while testing.",
    },
    {
      name: "How to disable mods quickly?",
      value:
        "Move the inactive half into a folder like `disabled-mods` so you can toggle groups without deleting anything.",
    },
  ];

  @Slash({ name: "binary-search", description: "How to debug mod issues with a binary search" })
  override async run(
    @SlashOption(userSlashOption)
    user: User | undefined,
    interaction: ChatInputCommandInteraction,
  ) {
    await super.run(user, interaction);
  }
}
