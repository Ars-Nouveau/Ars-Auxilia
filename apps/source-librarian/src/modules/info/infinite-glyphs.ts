import { type ChatInputCommandInteraction, type User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

import { InfoCommand } from "../../abstracts/info-command.js";
import { userSlashOption } from "../../util/interaction.js";

@Discord()
export class InfiniteGlyphsCommand extends InfoCommand {
  title = "Infinite Glyphs";
  description = "Instructions for increasing the glyph limit";
  lines = [
    "It's possible to increase the glyph limit in spells in two different ways.",
    "",
    "The first and easiest way is using a Spell Book from All-The-Arcanist-Gear, these have additional glyph slots baked into them.",
    "",
    "The second method is to modify the `ars_nouveau-server.toml` config file.",
    "To do this, you need to first set `infiniteSpells` to `true`. Secondly you need to modify `infiniteSpellLimit` to be the number of additional glyph slots you wish to have available.",
    "A value of `10` will grant the player 10 additional glyph slots, for a maximum of 20 glyphs per spell.",
    "A value of `-9` will cause the player to have just 1 glyph slot, essentially making the Spell Books only used for setting Enchanter Tools.",
  ];

  @Slash({ name: "infinite-glyphs", description: "Instructions for increasing the glyph limit" })
  override async run(
    @SlashOption(userSlashOption)
    user: User | undefined,
    interaction: ChatInputCommandInteraction,
  ) {
    await super.run(user, interaction);
  }
}
