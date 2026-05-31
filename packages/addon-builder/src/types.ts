export type RenderKind = "item" | "entity";
export type ItemRenderExtension = "png" | "webp";

export interface Options {
  ref?: string;
}

export interface GlyphAsset {
  animated: boolean;
  registryName: string;
}
