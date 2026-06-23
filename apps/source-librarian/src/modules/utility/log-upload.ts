import { type Attachment, Events } from "discord.js";
import { type ArgsOf, Discord, On } from "discordx";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MiB
const LOG_FILE_REGEX = /\.log(?:\.gz)?$/i;

interface LogsSuccess {
  success: true;
  id: string;
  url: string;
  raw: string;
}

interface LogsFailure {
  success: false;
  error: string;
}

type LogsResponse = LogsSuccess | LogsFailure;

const isCompressedLog = (attachment: Attachment): boolean =>
  attachment.name.toLowerCase().endsWith(".log.gz");

const unzipAttachment = async (
  attachment: Attachment,
  content: ArrayBuffer,
): Promise<string> => {
  try {
    const stream = new Blob([content])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).text();
  } catch (cause) {
    throw new Error(`Failed to decompress attachment: ${attachment.name}`, {
      cause,
    });
  }
};

const downloadAttachment = async (attachment: Attachment): Promise<string> => {
  const response = await fetch(attachment.url);

  if (!response.ok) {
    throw new Error(
      `Failed to download attachment: ${response.status} ${response.statusText}`,
      { cause: { url: attachment.url, status: response.status } },
    );
  }

  const content = await response.arrayBuffer();

  if (isCompressedLog(attachment)) {
    return unzipAttachment(attachment, content);
  }

  return new TextDecoder().decode(content);
};

const uploadLog = async (content: string): Promise<string> => {
  const response = await fetch("https://api.mclo.gs/1/log", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ content }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to upload log to mclo.gs: ${response.status} ${response.statusText}`,
      { cause: { status: response.status } },
    );
  }

  const payload = (await response.json()) as LogsResponse;

  if (!payload.success) {
    throw new Error(
      `mclo.gs API returned unsuccessful response: ${payload.error}`,
      { cause: payload },
    );
  }

  return payload.url;
};

@Discord()
export class LogUpload {
  @On({ event: Events.MessageCreate })
  async onMessage([message]: ArgsOf<Events.MessageCreate>) {
    if (!message.guild || message.author.bot) return;

    const logs = message.attachments.filter(
      (attachment) =>
        LOG_FILE_REGEX.test(attachment.name) &&
        attachment.size <= MAX_ATTACHMENT_SIZE,
    );

    if (logs.size === 0) return;

    const uploads: string[] = [];
    for (const attachment of logs.values()) {
      try {
        const content = await downloadAttachment(attachment);
        uploads.push(await uploadLog(content));
      } catch (error) {
        console.error("Failed to process log attachment", error);
      }
    }

    if (uploads.length === 0) return;

    await message.reply({ content: uploads.join("\n") });
  }
}
