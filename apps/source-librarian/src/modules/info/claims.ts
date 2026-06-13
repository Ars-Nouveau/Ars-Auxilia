import { type ChatInputCommandInteraction, type User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

import { InfoCommand } from "../../abstracts/info-command.js";
import { userSlashOption } from "../../util/interaction.js";

@Discord()
export class ClaimsCommand extends InfoCommand {
  description = "How to solve common claims issues";
  title = "<:break:1262385404745748632>   Spells inside Claimed Chunks";
  lines = [
    "Lots of spells in Ars Nouveau use fake players under the hood to achieve their effects, so you may need to trust the player Ars_Nouveau (or its UUID) inside your chunks.",
    "",
    "For MineColonies, it may be easier to view your Permission Events in your Town Hall, and trust the Ars_Nouveau player after attempting to fire a turret.",
  ];
  fields = [
    { name: "UUID", value: "`7400926d-1007-4e53-880f-b43e67f2bf29`" },
  ];

  @Slash({ name: "claims", description: "How to solve common claims issues" })
  override async run(
    @SlashOption(userSlashOption)
    user: User | undefined,
    interaction: ChatInputCommandInteraction,
  ) {
    await super.run(user, interaction);
  }
}
