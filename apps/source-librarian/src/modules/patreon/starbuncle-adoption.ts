import { readFileSync } from "node:fs";
import { createOrUpdateTextFile } from "@octokit/plugin-create-or-update-text-file";
import { Octokit } from "@octokit/rest";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  type ChatInputCommandInteraction,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  type ModalSubmitInteraction,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { ButtonComponent, Discord, ModalComponent, Slash } from "discordx";

const API = Octokit.plugin(createOrUpdateTextFile);
const octokit = new API({ auth: process.env.GITHUB_TOKEN });

interface SupportersData {
  uuids: string[];
  starbuncleAdoptions: StarbuncleAdoptionData[];
}

interface StarbuncleAdoptionData {
  name: string;
  adopter: string;
  color: string;
  bio: string;
}

const STARBUNCLE_COLORS = [
  "white",
  "orange",
  "magenta",
  "light_blue",
  "yellow",
  "lime",
  "pink",
  "gray",
  "light_gray",
  "cyan",
  "purple",
  "blue",
  "brown",
  "green",
  "red",
  "black",
] as const;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Allows Unicode letters, numbers, spaces, hyphens, underscores, and periods
const NAME_PATTERN = /^[\p{L}\p{N}\s\-_\.]+$/u;

async function createPR(branch: string, adopter: string, starbuncle: string) {
  if (adopter.endsWith("_draft")) return "";
  const pr = await octokit.pulls.create({
    owner: "baileyholl",
    repo: "Ars-Nouveau",
    base: "main",
    head: `Jarva:${branch}`,
    title: `(Starbuncle Adoption) ${adopter} wants to adopt ${starbuncle}`,
  });
  return pr.data.html_url;
}

function buildAdoptionModal(defaultName?: string) {
  const modal = new ModalBuilder()
    .setTitle("Starbuncle Adoption")
    .setCustomId("starbuncle_adoption");

  const uuid = new LabelBuilder()
    .setLabel("Minecraft UUID")
    .setTextInputComponent(
      new TextInputBuilder()
        .setCustomId("starbuncle_uuid")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(36)
        .setMinLength(36)
        .setRequired(true),
    );

  const color = new LabelBuilder()
    .setLabel("Starbuncle Color")
    .setTextInputComponent(
      new TextInputBuilder()
        .setCustomId("starbuncle_color")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("white, orange, magenta, light_blue, yellow, lime...")
        .setRequired(true),
    );

  const name = new LabelBuilder()
    .setLabel("Starbuncle Name")
    .setTextInputComponent(
      new TextInputBuilder()
        .setCustomId("starbuncle_name")
        .setStyle(TextInputStyle.Short)
        .setRequired(true),
    );

  const adopter = new LabelBuilder()
    .setLabel("Adopter Name")
    .setDescription("This name will be shown on the item")
    .setTextInputComponent(
      new TextInputBuilder()
        .setCustomId("adopter_name")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue(defaultName ?? ""),
    );

  const bio = new LabelBuilder()
    .setLabel("Starbuncle Bio")
    .setDescription("A short description about your Starbuncle!")
    .setTextInputComponent(
      new TextInputBuilder()
        .setCustomId("starbuncle_bio")
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(500)
        .setRequired(true),
    );

  modal.addLabelComponents(uuid, color, name, adopter, bio);

  return modal;
}

@Discord()
export class StarbuncleAdoption {
  @Slash({
    name: "starbuncle-adoption",
    description: "Create a button that opens the Starbuncle adoption form",
    defaultMemberPermissions: PermissionFlagsBits.ManageRoles,
  })
  async command(interaction: ChatInputCommandInteraction) {
    const file = readFileSync("./resources/starbuncle_colors.png");
    const attachment = new AttachmentBuilder(file, {
      name: "starbuncle_colors.png",
    });

    const button = new ButtonBuilder()
      .setCustomId("starbuncle_adoption:open")
      .setLabel("Adopt a Starbuncle")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    await interaction.reply({
      content: [
        "# Adopt-A-Starbuncle",
        "Patreon supporters are able to adopt Starbuncles that randomly spawn in the world.",
        "These Starbuncles retain their name, color, adopter name and biography even when turned into Starbuncle Tokens.",
        "",
        "Before you start the form, you'll need to [find your Minecraft UUID](<https://minecraftuuid.com/>)",
        "Once that's done, click button below to start the adoption process <a:starbuncle_speed:860323942005997588>",
      ].join("\n"),
      files: [attachment],
      components: [row],
    });
  }

  @ButtonComponent({ id: "starbuncle_adoption:open" })
  async button(interaction: ButtonInteraction) {
    const member = interaction.member;
    if (!member) return;

    const branchName = `adoption/${interaction.user.id}`;
    try {
      await octokit.git.getRef({
        owner: "Jarva",
        repo: "Ars-Nouveau",
        ref: `heads/${branchName}`,
      });
      await interaction.reply({
        content: "You already have a pending adoption. Please wait for it to be reviewed.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    } catch {
      // Branch doesn't exist, proceed
    }

    const nickname = "nickname" in member ? member.nickname : member.nick;
    const name = nickname ?? interaction.user.globalName ?? undefined;

    await interaction.showModal(buildAdoptionModal(name ?? undefined));
  }

  @ModalComponent({ id: "starbuncle_adoption" })
  async modal(interaction: ModalSubmitInteraction) {
    const uuid = interaction.fields.getTextInputValue("starbuncle_uuid");
    const colorInput = interaction.fields
      .getTextInputValue("starbuncle_color")
      .toLowerCase()
      .trim();
    const name = interaction.fields.getTextInputValue("starbuncle_name");
    const adopterName = interaction.fields.getTextInputValue("adopter_name");
    const bio = interaction.fields.getTextInputValue("starbuncle_bio");

    if (!UUID_PATTERN.test(uuid)) {
      return void (await interaction.reply({
        content: "Invalid Minecraft UUID format. Please provide a valid UUID.",
        flags: MessageFlags.Ephemeral,
      }));
    }

    if (
      !STARBUNCLE_COLORS.includes(
        colorInput as (typeof STARBUNCLE_COLORS)[number],
      )
    ) {
      return void (await interaction.reply({
        content: `Invalid color. Valid colors are: ${STARBUNCLE_COLORS.join(", ")}`,
        flags: MessageFlags.Ephemeral,
      }));
    }

    const textPatternError =
      "can only contain letters, numbers, spaces, hyphens, periods, and underscores. (If you believe your name should be allowed, please ping <@202407548916203520>)";

    if (!NAME_PATTERN.test(name)) {
      return void (await interaction.reply({
        content: `Starbuncle Name ${textPatternError}`,
        flags: MessageFlags.Ephemeral,
      }));
    }

    if (!NAME_PATTERN.test(adopterName)) {
      return void (await interaction.reply({
        content: `Adopter Name ${textPatternError}`,
        flags: MessageFlags.Ephemeral,
      }));
    }

    const baseRef = await octokit.git.getRef({
      owner: "baileyholl",
      repo: "Ars-Nouveau",
      ref: "heads/main",
    });
    const baseSha = baseRef.data.object.sha;

    const branchName = `adoption/${interaction.user.id}`;

    await octokit.git.createRef({
      owner: "Jarva",
      repo: "Ars-Nouveau",
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    await octokit.createOrUpdateTextFile({
      owner: "Jarva",
      repo: "Ars-Nouveau",
      path: "supporters.json",
      message: `feat(starbuncle-adoption): add starbuncle adoption for ${name}`,
      branch: branchName,
      committer: {
        name: "Source Librarian",
        email: "source-librarian@jarva.dev",
      },
      author: {
        name: "Source Librarian",
        email: "source-librarian@jarva.dev",
      },
      content({ exists, content }) {
        if (!exists) return null;

        const json = JSON.parse(content) as SupportersData;
        json.uuids.push(uuid);
        json.uuids = [...new Set(json.uuids)];

        json.starbuncleAdoptions.push({
          name,
          adopter: adopterName,
          color: colorInput,
          bio,
        });

        return JSON.stringify(json, null, 2);
      },
    });

    const url = await createPR(branchName, adopterName, name);

    await interaction.reply({
      content: [
        "<a:starbuncle_speed:860323942005997588> **Starbuncle adoption form received!**",
        `A [pull request](<${url}>) has been created. Once it's merged, your Starbuncle will become available in-game, either found randomly or spawned in with the following command:`,
        "```",
        `/ars-adopted by-adopter ${adopterName}`,
        "or",
        `/ars-adopted by-name ${name}`,
        "```",
      ].join("\n"),
      flags: MessageFlags.Ephemeral,
    });
  }
}
