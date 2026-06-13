import { Events } from "discord.js";
import { type ArgsOf, type Client, Discord, On } from "discordx";

import { reportAndTimeout } from "../../util/moderation.js";

@Discord()
export class EveryoneMonitor {
  @On({ event: Events.MessageCreate })
  async onMessage([message]: ArgsOf<Events.MessageCreate>, client: Client) {
    if (!message.guild || message.author.bot || message.mentions.everyone) return;
    if (!message.content.includes("@everyone")) return;

    await reportAndTimeout({
      client,
      message,
      messages: [{ id: message.id, channelId: message.channelId, timestamp: Date.now() }],
      reason: "Attempted to mention @everyone",
      timeoutMinutes: 15,
    });
  }
}
