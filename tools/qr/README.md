# @souty/qr

Generates the QR codes shown on the Souty pitch slides, and proves that each
one scans before you put it in front of a room.

## What it generates

For every entry in [`codes.json`](./codes.json), four files in
`docs/pitch/qr/`:

| File | What it is | Use it for |
|---|---|---|
| `<name>.svg` | The plain code. Plum on white, 4-module quiet zone. | Slides (scales to any size without blurring). |
| `<name>.png` | The same code, 2048 x 2048 px, opaque white background. | Tools that cannot import SVG. |
| `<name>-card.png` | The code on a Souty card: title, code, address. 1600 px wide, transparent outside the card. | Dropping straight onto a slide of any colour. |
| `<name>-card.svg` | Vector source of the card. | Editing in a design tool that has the two brand fonts installed. |

The codes use error correction level Q (about a quarter of the symbol can be
damaged or badly photographed and it still reads). The app code is a
version 3 symbol: 29 x 29 modules, large and easy to scan from a distance.

## Commands

Run from the repository root:

```sh
pnpm qr                                           # every entry of codes.json
pnpm qr --url https://example.org --name example  # one ad hoc code
pnpm qr --help
```

Options for an ad hoc code: `--title "Text above the code"`,
`--caption "text below it"` (defaults to the address without `https://`),
`--out some/dir` (defaults to `docs/pitch/qr`; a relative path is resolved
from the directory you ran the command in).

Arguments go straight after `pnpm qr`. `pnpm qr -- --url ...` works too, but
the extra `--` is not needed.

After writing the files, the tool reads each PNG back from disk, decodes it
with an independent QR reader, and compares the result with the address
character for character:

```
File                              Size                     Decoded
docs/pitch/qr/souty-app.svg       3.4 kB                   vector source
docs/pitch/qr/souty-app.png       2048 x 2048 px, 76.9 kB  OK  https://souty.vercel.app
docs/pitch/qr/souty-app-card.svg  3.9 kB                   vector source
docs/pitch/qr/souty-app-card.png  1600 x 1834 px, 82.0 kB  OK  https://souty.vercel.app

All 2 PNG(s) decode to their exact URL.
```

If any PNG does not decode to exactly its address, the command says so and
exits with a non-zero code. Do not use images from a failed run.

## Adding the marketing-site code

Once the marketing site is deployed and has its final address:

1. Add one entry to `codes.json`:

   ```json
   {
     "name": "souty-site",
     "url": "https://<the deployed address>",
     "caption": "<the address as people should read it>",
     "title": "Discover Souty"
   }
   ```

2. Run `pnpm qr`.
3. Check the table says `OK` for the new PNGs, then scan
   `docs/pitch/qr/souty-site-card.png` with a phone.

Rules for an entry: `name` is lowercase letters, digits and hyphens (it
becomes the file name); `url` must be `https` (plain `http` is accepted only
for `localhost`); `title` (up to 28 characters) and `caption` (up to 44) are
Latin text and optional. A code is permanent once people have scanned or
photographed it, so generate it for the final address, not a preview one.

## Putting a code on a slide

- **Keep the white margin.** The blank band around the code is part of it.
  Never crop it, and never let text, a logo or the slide edge touch it. The
  card already has it built in.
- **Make it big enough.** A good rule: the code should be at least one tenth
  of the viewing distance wide. For someone 8 m from the screen, that is
  80 cm on the screen.
- **Test from the back of the room**, on the venue's projector, with an
  iPhone and an Android phone. A code that scans on your laptop proves
  little about a washed-out projector.
- **Prefer the SVG** for the plain code, with the PNG as the fallback. For
  the card, use the PNG (see the note on fonts below).
- **Never recolour or stretch it.** Dark on light, square, as generated.
  Resize from a corner with the aspect ratio locked.
- Leave the code on screen long enough: say the address out loud while
  people scan, and keep it on the closing slide during questions.

## Reproducibility

The plain code is fully deterministic: the same address gives byte-identical
`.svg` and `.png` files on any machine.

The card is deterministic too. Its text is drawn with Souty's two brand
fonts, bundled in [`fonts/`](./fonts) (Baloo Bhaijaan 2 ExtraBold for the
title, Readex Pro SemiBold for the address, both under the SIL Open Font
License). The generator never reads the fonts installed on the machine, so
`-card.png` comes out the same on a laptop and on CI, and each line is
fitted by measuring its real glyphs.

`-card.svg` only names those fonts, it does not contain them: open it in a
design tool that has both installed, and use `-card.png` everywhere else.

## Development

```sh
cd tools/qr
pnpm test        # round trips, quiet zone, determinism, validation
pnpm typecheck
```

| File | Responsibility |
|---|---|
| `src/spec.ts` | Validates a code request (name, address, card text). |
| `src/matrix.ts` | The QR module matrix and its SVG path. |
| `src/svg.ts` | The plain code as SVG. |
| `src/card.ts` | The card layout and SVG. |
| `src/raster.ts` | SVG to PNG with resvg. |
| `src/verify.ts` | Decodes a PNG back to text with jsQR. |
| `src/assets.ts` | Builds the four files of one code. |
| `src/cli.ts` | `pnpm qr`: writes the files and verifies them. |
