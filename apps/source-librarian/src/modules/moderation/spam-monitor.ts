import { Events } from "discord.js";
import { type ArgsOf, type Client, Discord, On } from "discordx";

import { reportAndTimeout, type TrackedMessage } from "../../util/moderation.js";

const IMAGE_THRESHOLD = 4;
const STRIKE_THRESHOLD = 2;
const STRIKE_WINDOW_MS = 120_000;

const IMAGE_URL_PATTERN =
  /https?:\/\/\S+\.(?:png|jpe?g|gif|webp|bmp|svg|tiff?)(?:\?\S*)?/gi;

@Discord()
export class SpamMonitor {
  private tracked = new Map<string, TrackedMessage[]>();

  @On({ event: Events.MessageCreate })
  async onMessage([message]: ArgsOf<Events.MessageCreate>, client: Client) {
    if (!message.guild || message.author.bot) return;

    const imageAttachments = message.attachments.filter((a) =>
      a.contentType?.startsWith("image/"),
    );
    const imageLinks = message.content.match(IMAGE_URL_PATTERN) ?? [];
    const imageCount = imageAttachments.size + imageLinks.length;

    if (imageCount < IMAGE_THRESHOLD) return;

    const userId = message.author.id;
    const history = this.tracked.get(userId) ?? [];
    const now = Date.now();

    const recent = history.filter(
      (entry) => now - entry.timestamp < STRIKE_WINDOW_MS,
    );
    recent.push({
      id: message.id,
      channelId: message.channelId,
      timestamp: now,
    });
    this.tracked.set(userId, recent);

    if (recent.length < STRIKE_THRESHOLD) return;

    this.tracked.delete(userId);

    await reportAndTimeout({
      client,
      message,
      messages: recent,
      reason: "Image spam detected",
      timeoutMinutes: 15,
    });
  }
}
