import {
  type AutocompleteInteraction,
  SlashCommandStringOption,
} from "discord.js";

export interface Addon {
  /** CurseForge mod ID. */
  id: string;
  /** Discord discussion channel ID. */
  channel?: string;
  /** Hidden from autocomplete. */
  private?: boolean;
}

export const addons: Record<string, Addon> = {
  ars_nouveau: {
    id: "401955",
    channel: "743298050222587982",
    private: true,
  },
  ars_additions: {
    id: "974408",
    channel: "1207058223421595749",
  },
  ars_controle: {
    id: "1061812",
    channel: "1262068003072114750",
  },
  ars_technica: {
    id: "1096161",
    channel: "1281613727824613467",
  },
  ars_creo: {
    id: "575698",
    channel: "928865526078402580",
  },
  ars_instrumentum: {
    id: "580179",
    channel: "1019845252426776616",
  },
  ars_energistique: {
    id: "905641",
    channel: "1041655048574349342",
  },
  not_enough_glyphs: {
    id: "1023517",
    channel: "1222861594657030205",
  },
  ars_trinkets: {
    id: "950506",
    channel: "1189292470631141376",
  },
  starbunclemania: {
    id: "746215",
    channel: "1039885588310020176",
  },
  adams_ars_plus: {
    id: "1011093",
    channel: "1235001538611511357",
  },
  ars_omega: {
    id: "597007",
    channel: "1019672498213761084",
  },
  ars_delight: {
    id: "1131668",
    channel: "1301539822640435261",
  },
  ars_elemental: {
    id: "561470",
    channel: "1019900714044100699",
  },
  ars_scalaes: {
    id: "630431",
    channel: "1032058122505826375",
  },
  tome_of_blood_rebirth: {
    id: "911546",
    channel: "1131511198156857495",
  },
  ars_ocultas: {
    id: "907843",
    channel: "1131511198156857495",
  },
  ars_fauna: {
    id: "1055577",
    channel: "1258041008633942136",
  },
  ars_artifice: {
    id: "854169",
    channel: "1100053890411532408",
  },
  too_many_glyphs: {
    id: "560595",
    channel: "1022658726647316560",
  },
  ars_artillery: {
    id: "1070559",
    channel: "1265774509554794526",
  },
  ars_caelum: {
    id: "821651",
  },
  all_the_arcanist_gear: {
    id: "1094032",
  },
  ars_elemancy: {
    id: "1153666",
    channel: "1303504513830752306",
  },
  ars_polymorphia: {
    id: "1197614",
  },
  custom_machinery_ars_nouveau: {
    id: "969074",
  },
  modular_machinery_reborn_ars_nouveau: {
    id: "1132269",
  },
  reliquified_ars_nouveau: {
    id: "1196449",
  },
  ars_nouveau_refresh: {
    id: "1080571",
  },
  ars_nouveau_brassified: {
    id: "934703",
  },
  ars_loafers: {
    id: "1254524",
  },
  ars_technic: {
    id: "929916",
  },
  ars_knight_n_mages: {
    id: "914713",
  },
  samurai_dynasty: {
    id: "848381",
  },
  geore_nouveau: {
    id: "667803",
  },
  enigmatic_unity: {
    id: "808025",
  },
  ars_nouveau_dynamic_trees: {
    id: "874028",
  },
  hex_ars_linker: {
    id: "1134295",
    channel: "1338086578668703765",
  },
  ars_expanded_combat: {
    id: "957830",
  },
  ars_extended_glyphs: {
    id: "936742",
  },
  not_enough_sourcelinks: {
    id: "1159429",
  },
  ars_botania: {
    id: "1194681",
  },
  ars_unification: {
    id: "1165429",
    channel: "1321449687047340082",
  },
  ars_numerichud: {
    id: "1221985",
    channel: "1353092379628011650",
  },
  ars_zero: {
    id: "1377482",
    channel: "1432008462929236071",
  },
};

const choices = Object.entries(addons)
  .filter(([, addon]) => !addon.private)
  .map(([key]) => ({ name: key, value: key }));

export const addonSlashOption = new SlashCommandStringOption()
  .setName("addon")
  .setDescription("The name of the Ars Addon")
  .setRequired(true)
  .setAutocomplete(true);

export async function addonAutocomplete(
  interaction: AutocompleteInteraction,
): Promise<void> {
  const value = interaction.options.getFocused();
  const matches = value
    ? choices.filter((choice) => choice.name.includes(value))
    : choices;
  await interaction.respond(matches.slice(0, 25));
}
