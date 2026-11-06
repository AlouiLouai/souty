import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CSSProperties } from "react";
import { ImageResponse } from "next/og";
import { palette } from "@souty/brand/palette";
import { getDictionary } from "@/content";
import { defaultLocale, isLocale, locales, type Locale } from "@/i18n/config";
import { site } from "@/lib/site";

/*
 * The card people see when the site is shared in a chat or on social media.
 *
 * The image renderer cannot shape Arabic script (no letter joining, no
 * right-to-left) and only has its built-in Latin font, so this image never
 * draws Arabic text: the Arabic page shows the English tagline. The same
 * renderer needs `display: flex` on every element with several children.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = getDictionary(defaultLocale).meta.title;

/** One image per locale, generated at build time. */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** Locales whose script the renderer can draw. */
const DRAWABLE_LOCALES: readonly Locale[] = ["en", "fr"];

/** Taglines longer than this are set smaller so they still fit on two lines. */
const LONG_TAGLINE = 56;

/** Heights and colors of the sound-wave bars beside the name. */
const VOICE_BARS = [
  { height: 56, color: palette.sun },
  { height: 104, color: palette.harissa },
  { height: 150, color: palette.mint },
  { height: 84, color: palette.lilac },
  { height: 128, color: palette.harissa },
  { height: 68, color: palette.sun },
  { height: 40, color: palette.pink },
] as const;

const INK_BORDER = `8px solid ${palette.plum}`;

function taglineFor(locale: string): string {
  const drawable = isLocale(locale) && DRAWABLE_LOCALES.includes(locale);
  return getDictionary(drawable ? locale : defaultLocale).meta.ogTagline;
}

/** The logo mark as a data URI, or null if the file cannot be read. */
async function readLogoMark(): Promise<string | null> {
  try {
    const file = await readFile(path.join(process.cwd(), "public", "logo-mark.png"));
    return `data:image/png;base64,${file.toString("base64")}`;
  } catch {
    return null;
  }
}

/** A flat circle of color peeking in from a corner of the image. */
function CornerBlob({ diameter, color, ...position }: { diameter: number; color: string } & CSSProperties) {
  return (
    <div
      style={{
        position: "absolute",
        width: diameter,
        height: diameter,
        borderRadius: 999,
        backgroundColor: color,
        ...position,
      }}
    />
  );
}

interface ImageProps {
  // A plain object in Next 15, a promise from Next 16 on: `await` reads both.
  params: { locale: string } | Promise<{ locale: string }>;
}

export default async function OpenGraphImage({ params }: ImageProps) {
  const { locale } = await params;
  const tagline = taglineFor(locale);
  const logo = await readLogoMark();

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: palette.sky,
          color: palette.plum,
        }}
      >
        <CornerBlob diameter={330} color={palette.sun} top={-110} left={-90} />
        <CornerBlob diameter={400} color={palette.lilac} bottom={-150} right={-100} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: 1040,
            height: 478,
            marginRight: 14,
            marginBottom: 14,
            padding: "0 68px",
            backgroundColor: palette.paper,
            border: INK_BORDER,
            borderRadius: 56,
            boxShadow: `14px 14px 0 ${palette.plum}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 136,
                height: 136,
                marginRight: 30,
                backgroundColor: palette.plum,
                borderRadius: 999,
              }}
            >
              {logo ? (
                <div
                  style={{
                    width: 64,
                    height: 75,
                    backgroundImage: `url(${logo})`,
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                  }}
                />
              ) : null}
            </div>
            <div style={{ fontSize: 168, lineHeight: 1, letterSpacing: -5 }}>{site.name}</div>
            <div style={{ display: "flex", alignItems: "center", marginLeft: "auto" }}>
              {VOICE_BARS.map((bar, index) => (
                <div
                  key={index}
                  style={{
                    width: 30,
                    height: bar.height,
                    marginLeft: index === 0 ? 0 : 12,
                    backgroundColor: bar.color,
                    border: `5px solid ${palette.plum}`,
                    borderRadius: 999,
                  }}
                />
              ))}
            </div>
          </div>

          <div
            style={{
              width: 250,
              height: 18,
              marginTop: 22,
              backgroundColor: palette.sun,
              borderRadius: 999,
            }}
          />

          <div
            style={{
              maxWidth: 880,
              marginTop: 28,
              fontSize: tagline.length > LONG_TAGLINE ? 38 : 44,
              lineHeight: 1.25,
              textWrap: "balance",
            }}
          >
            {tagline}
          </div>

          <div style={{ display: "flex", marginTop: 30 }}>
            <div
              style={{
                padding: "10px 28px 12px",
                backgroundColor: palette.plum,
                color: palette.paper,
                borderRadius: 999,
                fontSize: 30,
              }}
            >
              {site.appDisplayUrl}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
