import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "@vercel/og";
import memoize from "memoize";
import sharp from "sharp";
import { description as siteTagline } from "./constants";

type CoverPage = { style: "cover" };

type ContentPage = {
  style: "content";
  title: string;
  label: string;
  description?: string;
  chapter?: string;
  iconUrl?: string;
};

export type OgPage = CoverPage | ContentPage;

interface OgAssets {
  bg: string;
  logo: string;
}

const loadAsset = async (filename: string) => {
  const buf = await readFile(join(process.cwd(), "assets", filename));
  return `data:image/png;base64,${buf.toString("base64")}`;
};

const getAsset = memoize(loadAsset);

const loadAssets = memoize(
  async (): Promise<OgAssets> => ({
    bg: await getAsset("archwood-bg.png"),
    logo: await getAsset("ars-guide-logo.png"),
  }),
);

const JOST_EXTRABOLD_URL =
  "https://fonts.gstatic.com/s/jost/v20/92zPtBhPNqw79Ij1E865zBUv7mwjIgVG.ttf";

const fetchIconDataUri = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/png";
    const buf = Buffer.from(await res.arrayBuffer());
    if (contentType === "image/webp") {
      const png = await sharp(buf).png().toBuffer();
      return `data:image/png;base64,${png.toString("base64")}`;
    }
    return `data:${contentType};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
};

const OgBase = ({
  assets,
  children,
}: {
  assets: OgAssets;
  children: React.ReactNode;
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      width: "1200px",
      height: "630px",
      backgroundColor: "#171f27",
      position: "relative",
    }}
  >
    <img
      src={assets.bg}
      alt=""
      width={1200}
      height={630}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "1200px",
        height: "630px",
        objectFit: "cover",
      }}
    />
    <div
      style={{
        display: "flex",
        position: "absolute",
        top: 0,
        left: 0,
        width: "1200px",
        height: "630px",
        background:
          "linear-gradient(to bottom, rgba(10,15,18,0.18) 0%, rgba(10,15,18,0.58) 52%, rgba(10,15,18,0.88) 100%)",
      }}
    />
    {children}
  </div>
);

const CollectionBadge = ({ label }: { label: string }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "absolute",
      top: "70px",
      right: "60px",
      paddingLeft: "20px",
      paddingRight: "20px",
      height: "50px",
      borderRadius: "25px",
      backgroundColor: "rgba(0, 0, 0, 0.42)",
    }}
  >
    <span
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: "24px",
        fontWeight: 700,
        letterSpacing: "1.5px",
        color: "#9fffc8",
      }}
    >
      {label}
    </span>
  </div>
);

const CoverOgImage = ({ assets }: { assets: OgAssets }) => (
  <OgBase assets={assets}>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        top: 0,
        left: 0,
        width: "1200px",
        height: "630px",
      }}
    >
      <img
        src={assets.logo}
        alt=""
        width={800}
        height={167}
        style={{ objectFit: "contain" }}
      />
      <span
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "32px",
          color: "#f1f7f4",
          textShadow: "0 4px 8px rgba(0, 0, 0, 0.75)",
          marginTop: "24px",
        }}
      >
        {siteTagline}
      </span>
    </div>
  </OgBase>
);

const ContentOgImage = ({
  page,
  assets,
  iconDataUri,
}: {
  page: ContentPage;
  assets: OgAssets;
  iconDataUri: string | null;
}) => (
  <OgBase assets={assets}>
    <img
      src={assets.logo}
      alt=""
      width={400}
      height={84}
      style={{
        position: "absolute",
        top: "50px",
        left: "60px",
        objectFit: "contain",
        objectPosition: "left top",
      }}
    />
    <CollectionBadge label={page.label} />
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        top: "140px",
        left: "60px",
        right: "60px",
        bottom: "50px",
      }}
    >
      <span
        style={{
          fontFamily: "Jost, sans-serif",
          fontSize: "84px",
          fontWeight: 800,
          letterSpacing: "-1.5px",
          color: "#ffffff",
          textShadow: "0 4px 8px rgba(0, 0, 0, 0.75)",
          textAlign: "center",
          maxWidth: "1080px",
        }}
      >
        {page.chapter ?? page.title}
      </span>
      {page.chapter ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "24px",
          }}
        >
          {iconDataUri ? (
            <img
              src={iconDataUri}
              alt=""
              width={70}
              height={70}
              style={{ imageRendering: "pixelated", marginRight: "16px" }}
            />
          ) : null}
          <span
            style={{
              fontFamily: "Arial, sans-serif",
              fontSize: "70px",
              fontWeight: 600,
              color: "#f1f7f4",
              textShadow: "0 4px 8px rgba(0, 0, 0, 0.75)",
              textAlign: "center",
              maxWidth: "1000px",
            }}
          >
            {page.title}
          </span>
        </div>
      ) : null}
      {!page.chapter && page.description ? (
        <span
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "38px",
            lineHeight: "1.22",
            color: "#f1f7f4",
            textShadow: "0 4px 8px rgba(0, 0, 0, 0.75)",
            textAlign: "center",
            marginTop: "16px",
            maxWidth: "1000px",
          }}
        >
          {page.description}
        </span>
      ) : null}
    </div>
  </OgBase>
);

const loadJostFont = async () =>
  await fetch(JOST_EXTRABOLD_URL).then((res) => res.arrayBuffer());

const jostFont = memoize(loadJostFont);

const getImage = async (page: OgPage, assets: OgAssets) => {
  switch (page.style) {
    case "cover":
      return <CoverOgImage assets={assets} />;
    case "content": {
      const iconDataUri = page.iconUrl
        ? await fetchIconDataUri(page.iconUrl)
        : null;
      return <ContentOgImage page={page} assets={assets} iconDataUri={iconDataUri} />;
    }
    default: {
      const _exhaustive: never = page;
      throw new Error(`Unknown OG image style: ${JSON.stringify(_exhaustive)}`);
    }
  }
};

export const createOgImageResponse = async (page: OgPage) => {
  const [assets, fontData] = await Promise.all([loadAssets(), jostFont()]);
  const fonts = [{ name: "Jost", data: fontData, weight: 800 as const }];
  const jsx = await getImage(page, assets);
  return new ImageResponse(jsx, { width: 1200, height: 630, fonts });
};
