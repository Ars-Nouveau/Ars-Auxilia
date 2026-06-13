import { type APIEmbedField, type ChatInputCommandInteraction, EmbedBuilder, type User } from "discord.js";
import { getEphemeral, getMention } from "../util/interaction.js";

export abstract class InfoCommand {
  abstract readonly description: string;
  readonly title?: string;
  readonly lines: string[] = [];
  readonly image?: string;
  readonly url?: string;
  readonly fields: APIEmbedField[] = [];

  async run(_user: User | undefined, interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder({
      title: this.title ?? this.description,
      color: 0x231631,
      description: this.lines.join("\n"),
      image: this.image
        ? {
            url: this.image,
          }
        : undefined,
      url: this.url,
      fields: [
        ...this.fields,
        {
          name: "Noticed a problem?",
          value: "Please raise an issue with <@202407548916203520>",
        },
      ],
    });

    await interaction.reply({
      content: getMention(interaction),
      embeds: [embed],
      flags: getEphemeral(interaction),
    });
  }
}
