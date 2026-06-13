import { type ChatInputCommandInteraction, type User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

import { InfoCommand } from "../../abstracts/info-command.js";
import { userSlashOption } from "../../util/interaction.js";

@Discord()
export class IframesCommand extends InfoCommand {
  description = "What are I-Frames?";
  url = "https://ars.guide/docs/spell_theory/iframes/";
  lines = [
    "I-Frames or Immunity Frames, are durations where a player is invulnerable to damage. Ways to bypass these immunity frames are referred to as I-Frame Skips.",
    "",
    "In the base mod, there are no I-Frame skips available. In 1.21.1, Ars Elemental adds a glyph called Nullify Defense that will reset an entities I-Frames. In older versions there are other I-Frame skips available.",
    "",
    'Please check out ["What is an I-Frame" on Ars.Guide](https://ars.guide/docs/spell_theory/iframes/) for more information.',
  ];

  @Slash({ name: "iframes", description: "What are I-Frames?" })
  override async run(
    @SlashOption(userSlashOption)
    user: User | undefined,
    interaction: ChatInputCommandInteraction,
  ) {
    await super.run(user, interaction);
  }
}
