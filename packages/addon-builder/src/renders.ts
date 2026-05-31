import { OUTPUT_DIRECTORY } from "./constants";
import { parseResourceLocation } from "./resource-location";
import type { ItemRenderExtension, Options } from "./types";
import { getRenderBaseUrl } from "./urls";

const ITEM_RENDER_PATH_PREFIX = `/${OUTPUT_DIRECTORY}/renders/item/`;

const getItemRenderExtensionEntry = (pathName: string) => {
  const markerIndex = pathName.indexOf(ITEM_RENDER_PATH_PREFIX);
  if (markerIndex < 0) return undefined;

  const renderPath = pathName.slice(
    markerIndex + ITEM_RENDER_PATH_PREFIX.length,
  );
  const namespaceEndIndex = renderPath.indexOf("/");
  if (namespaceEndIndex <= 0) return undefined;

  const namespace = renderPath.slice(0, namespaceEndIndex);
  const filePath = renderPath.slice(namespaceEndIndex + 1);
  const extension: ItemRenderExtension | undefined = filePath.endsWith(".webp")
    ? "webp"
    : filePath.endsWith(".png")
      ? "png"
      : undefined;
  if (!extension) return undefined;

  const path = filePath.slice(0, -`.${extension}`.length);
  if (!path) return undefined;

  return {
    key: `${namespace}:${path}`,
    extension,
  };
};

export const getItemRenderExtensions = (paths: string[]) => {
  const extensions = new Map<string, ItemRenderExtension>();

  for (const pathName of paths) {
    const entry = getItemRenderExtensionEntry(pathName);
    if (!entry) continue;

    const existing = extensions.get(entry.key);

    if (!existing || entry.extension === "webp") {
      extensions.set(entry.key, entry.extension);
    }
  }

  return extensions;
};

export const getItemRenderUrl = (
  item: string | undefined,
  renderExtensions?: ReadonlyMap<string, ItemRenderExtension>,
  options?: Options,
) => {
  if (!item) return undefined;

  const { namespace, path, key } = parseResourceLocation(item, "minecraft");
  const extension = renderExtensions?.get(key) ?? "png";

  return `${getRenderBaseUrl("item", options)}/${namespace}/${path}.${extension}`;
};

export const getEntityRenderUrl = (entity: string, options?: Options) => {
  const { namespace, path } = parseResourceLocation(entity, "minecraft");

  return `${getRenderBaseUrl("entity", options)}/${namespace}/${path}.png`;
};
