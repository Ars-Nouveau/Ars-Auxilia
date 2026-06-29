import { type ChatInputCommandInteraction, type User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

import { InfoCommand } from "../../abstracts/info-command.js";
import { userSlashOption } from "../../util/interaction.js";

@Discord()
export class OptimizationCommand extends InfoCommand {
  description = "How do I make my game run faster?";
  lines = [
    "Optimization mods may affect the client (FPS), the server (TPS), or both. The ones listed here are compatible with most mods and aim to not affect gameplay.",
    "Usage of OptiFine is discouraged as it tends to be incompatible with many mods, including Ars Nouveau.",
  ];
  fields = [
    {
      name: "Sodium (Client) [Curseforge](<https://www.curseforge.com/minecraft/mc-mods/sodium>) [Modrinth](<https://modrinth.com/mod/sodium>)",
      value: "Can drastically improve frame-rates, compatible with shaders via Iris."
    },
    {
      name: "Lithium (Both) [Curseforge](<https://www.curseforge.com/minecraft/mc-mods/lithium>) [Modrinth](<https://modrinth.com/mod/lithium>)",
      value: "General-purpose optimization mod mostly focused on Vanilla systems."
    },
    {
      name: "FerriteCore (Both) [Curseforge](<https://www.curseforge.com/minecraft/mc-mods/ferritecore>) [Modrinth](<https://modrinth.com/mod/ferrite-core>)",
      value: "Reduces memory usage, can be quite significant in larger modpacks."
    },
    {
      name: "ImmediatelyFast (Client) [Curseforge](<https://www.curseforge.com/minecraft/mc-mods/immediatelyfast>) [Modrinth](<https://modrinth.com/mod/immediatelyfast>)",
      value: "Batches immediate mode rendering tasks to, often leading to notable improvements."
    },
    {
      name: "ScalableLux (Both) [Curseforge](<https://www.curseforge.com/minecraft/mc-mods/scalablelux>) [Modrinth](<https://modrinth.com/mod/scalablelux>)",
      value: "Replaces the light engine with a faster one, helps especially with chunk generation."
    },
    {
      name: "ModernFix (Both) [Curseforge](<https://www.curseforge.com/minecraft/mc-mods/modernfix>) [Modrinth](<https://modrinth.com/mod/modernfix>)",
      value: "Various optimizations and bug fixes to vanilla and unmaintained mods."
    }
  ];

  @Slash({ name: "optimization", description: "How do I make my game run faster?" })
  override async run(
    @SlashOption(userSlashOption)
    user: User | undefined,
    interaction: ChatInputCommandInteraction,
  ) {
    await super.run(user, interaction);
  }
}
