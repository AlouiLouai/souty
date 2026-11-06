import { Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { Dictionary } from "@/content";

interface DifferenceTableProps {
  difference: Dictionary["proof"]["difference"];
  /** Id for the caption heading, which also names the table. */
  headingId: string;
}

/**
 * Compares Souty with typical sign-language tools, one criterion per row.
 *
 * On phones each row takes two lines (the criterion, then both answers side
 * by side), so the table never scrolls sideways. From `sm` up it is a plain
 * three-column table.
 *
 * The phone layout changes the CSS display of table elements, which makes
 * some browsers forget they are a table. The explicit ARIA roles keep the
 * table semantics for assistive technology in both layouts.
 */
export function DifferenceTable({ difference, headingId }: DifferenceTableProps) {
  return (
    <Card depth="lg" className="mx-auto max-w-[56rem] overflow-hidden">
      <table
        role="table"
        aria-labelledby={headingId}
        className="block w-full border-collapse text-start sm:table sm:table-fixed"
      >
        <caption className="block border-b-3 border-plum bg-sun px-4 py-4 text-center sm:table-caption sm:px-6">
          <h3 id={headingId} className="text-[clamp(1.35rem,3vw,1.75rem)] font-extrabold">
            {difference.title}
          </h3>
        </caption>

        <thead role="rowgroup" className="block border-b-3 border-plum sm:table-header-group">
          <tr role="row" className="grid grid-cols-2 sm:table-row">
            <th
              role="columnheader"
              scope="col"
              className="sr-only sm:not-sr-only sm:table-cell sm:w-[24%] sm:bg-sky sm:px-5 sm:py-3 sm:text-start sm:align-middle sm:font-display sm:text-[0.95rem] sm:font-bold sm:text-plum-soft"
            >
              {difference.criterionHeader}
            </th>
            <th
              role="columnheader"
              scope="col"
              className="bg-paper px-3 py-3 text-start align-middle font-display text-[0.95rem] font-bold leading-snug text-plum-soft sm:table-cell sm:px-5"
            >
              {difference.othersHeader}
            </th>
            <th
              role="columnheader"
              scope="col"
              className="bg-mint px-3 py-3 text-start align-middle font-display text-[1.15rem] font-extrabold leading-snug text-plum sm:table-cell sm:px-5"
            >
              {difference.soutyHeader}
            </th>
          </tr>
        </thead>

        <tbody role="rowgroup" className="block sm:table-row-group">
          {difference.rows.map((row) => (
            <tr
              key={row.criterion}
              role="row"
              className="grid grid-cols-2 border-t-2 border-lilac first:border-t-0 sm:table-row"
            >
              <th
                role="rowheader"
                scope="row"
                className="col-span-2 bg-sky px-3 py-2 text-start font-display text-[1.05rem] font-bold leading-snug text-plum sm:table-cell sm:px-5 sm:py-4 sm:align-top"
              >
                {row.criterion}
              </th>
              <td
                role="cell"
                className="break-words px-3 py-3 align-top text-[0.95rem] leading-snug text-plum-soft sm:table-cell sm:px-5 sm:py-4 sm:text-[1rem]"
              >
                {row.others}
              </td>
              <td
                role="cell"
                className="bg-[#DDF8F1] px-3 py-3 align-top text-[0.95rem] font-bold leading-snug text-plum sm:table-cell sm:px-5 sm:py-4 sm:text-[1rem]"
              >
                <span className="flex items-start gap-2">
                  <span
                    className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-plum bg-mint"
                    aria-hidden="true"
                  >
                    <Check className="h-3 w-3" strokeWidth={4} />
                  </span>
                  <span className="min-w-0 break-words">{row.souty}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
