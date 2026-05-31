import { DEFAULT_REF, OUTPUT_DIRECTORY, OWNER, REPO } from "./constants";
import type { Options, RenderKind } from "./types";

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

export const getGithubBase = () => `https://github.com/${OWNER}/${REPO}`;

export const getCDNBase = ({ ref = DEFAULT_REF }: Options = {}) =>
  `https://cdn.jsdelivr.net/gh/${OWNER}/${REPO}@${ref}/${OUTPUT_DIRECTORY}`;

export const getArchiveUrl = ({ ref = DEFAULT_REF }: Options = {}) =>
  `${getGithubBase()}/archive/refs/heads/${ref}.zip`;

export const getOutputUrl = (path: string, options?: Options) =>
  `${getCDNBase(options)}/${trimSlashes(path)}`;

export const getLangUrl = (locale = "en_us", options?: Options) =>
  getOutputUrl(`lang/${locale}.json`, options);

export const getGlyphsUrl = (options?: Options) =>
  getOutputUrl("glyphs.json", options);

export const getRenderBaseUrl = (kind: RenderKind, options?: Options) =>
  getOutputUrl(`renders/${kind}`, options);
