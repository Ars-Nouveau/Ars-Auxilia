import { toTitleCase } from "@ars/types";
import { Pagination } from "@discordx/pagination";
import {
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandStringOption,
} from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import { getGlyphsByMod, getLang, getProjects } from "../../util/glyphs.js";

const GLYPHS_PER_PAGE = 5;

const modOption = new SlashCommandStringOption()
  .setName("mod")
  .setDescription("Mod to list glyphs from")
  .setRequired(true)
  .setAutocomplete(true);

@Discord()
@SlashGroup("glyph")
export class GlyphListCommand {
  @Slash({ name: "list", description: "List all glyphs from a mod" })
  async run(
    @SlashOption(modOption)
    mod: string,
    interaction: ChatInputCommandInteraction | AutocompleteInteraction,
  ) {
    if (interaction.isAutocomplete()) {
      return this.autocomplete(interaction);
    }

    const [projects, glyphs, lang] = await Promise.all([
      getProjects(),
      getGlyphsByMod(mod),
      getLang(),
    ]);

    const project = projects[mod];
    const modName = project?.display_name ?? toTitleCase(mod);

    if (glyphs.length === 0) {
      await interaction.reply({
        content: `No glyphs found for **${modName}**.`,
      });
      return;
    }

    const modUrl = project
      ? `https://www.curseforge.com/projects/${project.cf_id}`
      : undefined;

    const pages = [];
    for (let i = 0; i < glyphs.length; i += GLYPHS_PER_PAGE) {
      const chunk = glyphs.slice(i, i + GLYPHS_PER_PAGE);
      const fields = chunk.map(([, glyph]) => {
        const typeName =
          lang[glyph.typeName.translate] ?? glyph.typeName.translate;
        const descKey = glyph.localizationKey.replace(
          "glyph_name",
          "glyph_desc",
        );
        const description = lang[descKey] ?? descKey;

        return {
          name: `${typeName}: ${glyph.name}`,
          value: description,
        };
      });

      pages.push({
        embeds: [
          new EmbedBuilder({
            title: `Glyphs from ${modName}`,
            url: modUrl,
            color: 0x231631,
            fields,
            footer: {
              text: `${glyphs.length} glyphs total`,
            },
          }),
        ],
      });
    }

    if (pages.length === 1) {
      await interaction.reply(pages[0]);
      return;
    }

    const pagination = new Pagination(interaction, pages, {
      buttons: {
        previous: {
          emoji: null,
          label: "Back"
        },
        next: {
          emoji: null,
          label: "Next"
        },
        backward: {
          enabled: false
        },
        forward: {
          enabled: false
        }
      },
      selectMenu: {
        disabled: true
      }
    });
    await pagination.send();
  }

  private async autocomplete(interaction: AutocompleteInteraction) {
    try {
      const focused = interaction.options.getFocused().toLowerCase();
      const projects = await getProjects();
      const matches = Object.values(projects)
        .filter(
          (p) =>
            p.mod_id.toLowerCase().includes(focused) ||
            p.display_name.toLowerCase().includes(focused),
        )
        .slice(0, 25);

      await interaction.respond(
        matches.map((p) => ({ name: p.display_name, value: p.mod_id })),
      );
    } catch {
      await interaction.respond([]);
    }
  }
}
