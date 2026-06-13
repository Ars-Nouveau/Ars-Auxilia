import {
  type APIApplicationCommandBasicOption,
  ApplicationCommandOptionType,
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandUserOption,
} from "discord.js";

export const userTargetOption: APIApplicationCommandBasicOption = {
  name: "user",
  description: "User to mention",
  type: ApplicationCommandOptionType.User,
  required: false,
};

export const userSlashOption = new SlashCommandUserOption()
  .setName("user")
  .setDescription("User to mention")
  .setRequired(false);

export function isEphemeral(
  interaction: ChatInputCommandInteraction,
  target: APIApplicationCommandBasicOption = userTargetOption,
) {
  return !interaction.options.getUser(target.name);
}

export function getEphemeral(
  interaction: ChatInputCommandInteraction,
  target: APIApplicationCommandBasicOption = userTargetOption,
) {
  return isEphemeral(interaction, target) ? MessageFlags.Ephemeral : undefined;
}

export function getMention(
  interaction: ChatInputCommandInteraction,
  target: APIApplicationCommandBasicOption = userTargetOption,
) {
  const user = interaction.options.getUser(target.name);
  if (user) return `<@${user.id}>`;
  return undefined;
}
