import { notFound } from "next/navigation";
import { Cta } from "@/components/sections/Cta";
import { Hero } from "@/components/sections/Hero";
import { Idea } from "@/components/sections/Idea";
import { Problem } from "@/components/sections/Problem";
import { Product } from "@/components/sections/Product";
import { Proof } from "@/components/sections/Proof";
import { Roadmap } from "@/components/sections/Roadmap";
import { Vision } from "@/components/sections/Vision";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { JsonLd } from "@/components/site/JsonLd";
import { getDictionary } from "@/content";
import { isLocale } from "@/i18n/config";

/**
 * The whole story on one page, in the order an investor needs it:
 * the problem, the idea, what is built today, proof, then where it goes.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const props = { dict, locale };

  return (
    <>
      <JsonLd {...props} />
      <Header {...props} />
      <main id="main">
        <Hero {...props} />
        <Problem {...props} />
        <Idea {...props} />
        <Product {...props} />
        <Proof {...props} />
        <Roadmap {...props} />
        <Vision {...props} />
        <Cta {...props} />
      </main>
      <Footer {...props} />
    </>
  );
}
