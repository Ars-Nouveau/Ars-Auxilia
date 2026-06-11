export type RenderKind = "item" | "entity";
export type ItemRenderExtension = "png" | "webp";
export type ItemRenderLocation = ItemRenderExtension | string;

export interface Options {
  ref?: string;
}

export interface GlyphAsset {
  animated: boolean;
  registryName: string;
}
