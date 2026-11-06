import { Mail } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import type { Dictionary } from "@/content";

interface PartnerCardProps {
  /** Address the request is sent to. */
  email: string;
  copy: Dictionary["cta"]["partner"];
}

/**
 * "Work with us": an invitation to public services, associations and
 * programmes, with a link that opens an email to the team.
 */
export function PartnerCard({ email, copy }: PartnerCardProps) {
  const href = `mailto:${email}?subject=${encodeURIComponent(copy.subject)}`;

  return (
    <Reveal className="mt-12 sm:mt-14">
      <Card
        tone="sun"
        depth="lg"
        className="mx-auto flex max-w-4xl flex-col items-start gap-5 p-6 sm:p-8 md:flex-row md:items-center md:justify-between md:gap-8"
      >
        <div className="grid gap-2">
          <h3 className="text-[1.6rem] font-extrabold">{copy.title}</h3>
          <p className="max-w-[52ch]">{copy.body}</p>
        </div>
        <ButtonLink variant="paper" href={href} className="shrink-0 text-center">
          <Mail aria-hidden="true" className="size-5" strokeWidth={2.5} />
          {copy.action}
        </ButtonLink>
      </Card>
    </Reveal>
  );
}
