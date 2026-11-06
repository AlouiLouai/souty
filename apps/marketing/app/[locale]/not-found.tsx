import { headers } from "next/headers";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getDictionary } from "@/content";
import { defaultLocale } from "@/i18n/config";
import { localeFromPathname } from "@/i18n/negotiate";

/**
 * Localized 404. not-found.tsx receives no params, so the locale is read
 * from the request path that middleware forwards.
 */
export default async function NotFound() {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const locale = localeFromPathname(pathname) ?? defaultLocale;
  const { meta } = getDictionary(locale);

  return (
    <main id="main" className="grid min-h-[100dvh] place-items-center bg-sky py-20">
      <Container className="grid justify-items-center gap-5 text-center">
        <p className="font-display text-[5rem] font-extrabold leading-none text-plum" aria-hidden="true">
          404
        </p>
        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold text-plum">{meta.notFound.title}</h1>
        <p className="max-w-[44ch] text-plum-soft">{meta.notFound.body}</p>
        <ButtonLink href={`/${locale}`}>{meta.notFound.action}</ButtonLink>
      </Container>
    </main>
  );
}
