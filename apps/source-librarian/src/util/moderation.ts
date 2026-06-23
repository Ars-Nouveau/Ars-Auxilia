import { type Message, TextChannel } from "discord.js";
import type { Client } from "discordx";
import { Result } from "typescript-result";

export interface TrackedMessage {
  id: string;
  channelId: string;
  timestamp: number;
}

const REPORT_CHANNEL_ID = "1285648414373056595";

const safely = <T>(p: Promise<T>) => Result.try(() => p);

async function reportToChannel(client: Client, message: Message, reason: string) {
  const result = await safely(client.channels.fetch(REPORT_CHANNEL_ID));
  await result.map(async channel => {
    if (channel instanceof TextChannel) {
      await safely(message.forward(channel));
      await safely(
        channel.send({
          content:
            `**${reason}** from <@${message.author.id}> in <#${message.channelId}>\n` +
            `Attachments: ${message.attachments.size}`,
        })
      )
    }
  })
}

async function warnViaDM(message: Message, reason: string, timeoutMinutes: number) {
  const result = await safely(message.author.createDM());
  await result.map(async dm => {
    await safely(message.forward(dm));
    await safely(
      dm.send(
        `You have been timed out for ${timeoutMinutes} minutes for: ${reason}. ` +
          "If you believe this was a mistake, please DM an Admin.",
      ),
    );
  })
}

async function deleteMessages(client: Client, messages: TrackedMessage[]) {
  for (const entry of messages) {
    const result = safely(client.channels.fetch(entry.channelId));
    await result.map(async channel => {
      if (channel instanceof TextChannel) {
        await safely(channel.messages.delete(entry.id));
      }
    })
  }
}

async function timeoutMember(message: Message, timeoutMinutes: number, reason: string) {
  const result = message.member
    ? Result.ok(message.member)
    : await safely(message.guild!.members.fetch(message.author.id));
  await result.map(async member => {
    await safely(member.timeout(timeoutMinutes * 60 * 1000, reason));
  })
}

export async function reportAndTimeout(options: {
  client: Client;
  message: Message;
  messages: TrackedMessage[];
  reason: string;
  timeoutMinutes: number;
}) {
  const { client, message, messages, reason, timeoutMinutes } = options;

  await timeoutMember(message, timeoutMinutes, reason);
  await reportToChannel(client, message, reason);
  await warnViaDM(message, reason, timeoutMinutes);
  await deleteMessages(client, messages);
}
