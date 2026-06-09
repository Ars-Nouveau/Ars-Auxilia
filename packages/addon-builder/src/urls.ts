import { DEFAULT_REF, OWNER, REPO } from "./constants";
import type { Options, RenderKind } from "./types";

const ASSETS_BASE = "https://assets.ars.guide";

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

export const getGithubBase = () => `https://github.com/${OWNER}/${REPO}`;

export const getArchiveUrl = ({ ref = DEFAULT_REF }: Options = {}) =>
  `${getGithubBase()}/archive/refs/heads/${ref}.zip`;

export const getOutputUrl = (path: string) =>
  `${ASSETS_BASE}/${trimSlashes(path)}`;

export const getLangUrl = (locale = "en_us") =>
  getOutputUrl(`lang/${locale}.json`);

export const getGlyphsUrl = () => getOutputUrl("glyphs.json");

export const getRenderBaseUrl = (kind: RenderKind) =>
  getOutputUrl(`renders/${kind}`);
