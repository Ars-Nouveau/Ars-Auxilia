import {
  ApplicationCommandType,
  MessageFlags,
  type MessageContextMenuCommandInteraction,
} from "discord.js";
import { ContextMenu, Discord } from "discordx";

@Discord()
export class PinInThreadCommand {
  @ContextMenu({ name: "Pin In Thread", type: ApplicationCommandType.Message })
  async run(interaction: MessageContextMenuCommandInteraction) {
    const { channel } = interaction;

    if (!channel?.isThread()) {
      await interaction.reply({
        content: "This command is only for use in threads",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (channel.ownerId !== interaction.user.id) {
      await interaction.reply({
        content: "This command is only for thread-owners",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const message = interaction.targetMessage;

    if (message.pinned) {
      await message.unpin();
      await interaction.reply({
        content: "Message Unpinned",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await message.pin();
    await interaction.reply({
      content: "Message Pinned",
      flags: MessageFlags.Ephemeral,
    });
  }
}
