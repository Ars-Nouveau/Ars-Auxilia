import "varlock/auto-load";
import { dirname, importx } from "@discordx/importer";
import { Events, GatewayIntentBits } from "discord.js";
import { Client } from "discordx";
import { ENV } from "varlock/env";

const guildId = ENV.BOT_GUILD_ID?.trim();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  silent: true,
  botGuilds: guildId ? [guildId] : []
});

client.on(Events.ClientReady, async () => {
  console.log(
    `>> Bot started, registering commands ${guildId ? `to guild ${guildId}` : "globally"}`,
  );

  await client.initApplicationCommands(false);
});

client.on(Events.InteractionCreate, (interaction) => {
  client.executeInteraction(interaction);
});

await importx(`${dirname(import.meta.url)}/modules/**/*.{js,ts}`);

await client.login(ENV.DISCORD_TOKEN);
