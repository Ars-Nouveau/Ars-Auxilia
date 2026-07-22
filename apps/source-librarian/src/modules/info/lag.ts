import { type ChatInputCommandInteraction, type User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

import { InfoCommand } from "../../abstracts/info-command.js";
import { userSlashOption } from "../../util/interaction.js";

@Discord()
export class LagCommand extends InfoCommand {
  description = "How can I debug lag?";
  url = "https://spark.lucko.me/";
  lines = [
    "Spark is the best available tool for debugging lag. It provides more accurate reports as to what is causing the lag, but it doesn't show where in the world the lag is occuring. This is the one use-case that I'd recommend using Observable for.",
    "If you are using Java 25 on Minecraft 1.21.1, you will need to add the `--force-java-sampler` flag when starting a profiler",
  ];
  fields = [
    {
      name: "Constant Lag",
      value: "`/spark profiler --timeout 300`",
    },
    {
      name: "Lag Spikes",
      value: "`/spark profiler --only-ticks-over 100 --timeout 300`",
    },
    {
      name: "FPS Issues",
      value: "`/sparkc profiler --timeout 300`",
    },
  ];

  @Slash({ name: "lag", description: "How can I debug lag?" })
  override async run(
    @SlashOption(userSlashOption)
    user: User | undefined,
    interaction: ChatInputCommandInteraction,
  ) {
    await super.run(user, interaction);
  }
}
