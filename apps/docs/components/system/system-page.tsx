import * as React from "react";

import { InlineProse } from "@/components/component-docs";
import { DERIVED_ROWS } from "@/content/system/derived";
import { GATE_ROWS } from "@/content/system/gates";
import { resolveFacts, type PageBlock, type SystemFacts, type SystemPage } from "@/lib/system-page";

import { DerivedTable } from "./derived-table";
import { FigureFrame } from "./figure-frame";
import { FIGURES } from "./figures";
import { GatesTable } from "./gates-table";

/** How a link is drawn. The Next routes pass next/link. Storybook passes
 *  nothing and gets a plain anchor. This file imports neither, so both
 *  surfaces can bundle it. */
export type LinkRenderer = (props: {
  href: string;
  className: string;
  children: React.ReactNode;
}) => React.ReactElement;

const plainLink: LinkRenderer = ({ href, className, children }) => (
  <a href={href} className={className}>
    {children}
  </a>
);

interface ViewProps {
  page: SystemPage;
  facts: SystemFacts;
  surface?: "next" | "storybook";
  link?: LinkRenderer;
}

function Block({ block, facts, surface, link }: { block: PageBlock } & Required<Omit<ViewProps, "page">>) {
  const text = (value: string) => <InlineProse text={resolveFacts(value, facts)} />;

  switch (block.kind) {
    case "p":
      return <p className="leading-7">{text(block.text)}</p>;
    case "quote":
      return <blockquote className="border-l-2 pl-4 leading-7">{text(block.text)}</blockquote>;
    case "list":
      return (
        <ol className="list-decimal space-y-2 pl-5 leading-7">
          {block.items.map((item) => (
            <li key={item}>{text(item)}</li>
          ))}
        </ol>
      );
    case "table":
      return (
        <table className="w-full table-fixed border-collapse text-sm leading-6">
          <thead>
            <tr>
              {block.columns.map((column) => (
                <th key={column} scope="col" className="border-b py-2 pr-4 text-left font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr key={row.join("|")}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="border-b py-2 pr-4 align-top">
                    {text(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case "figure": {
      const Figure = FIGURES[block.figure];
      if (!Figure) throw new Error(`figure not built: ${block.figure}`);
      return (
        <FigureFrame id={block.figure} caption={resolveFacts(block.caption, facts)}>
          <Figure facts={facts} />
        </FigureFrame>
      );
    }
    case "gates":
      return <GatesTable rows={GATE_ROWS} />;
    case "derived":
      return <DerivedTable rows={DERIVED_ROWS} />;
    case "links":
      return (
        <ul className="space-y-1.5 leading-7">
          {block.items.map((item) => (
            <li key={item.href}>
              {link({
                href: surface === "storybook" ? (item.storybook ?? item.href) : item.href,
                className: "underline underline-offset-4",
                children: item.label,
              })}
            </li>
          ))}
        </ul>
      );
  }
}

/** Renders a system page. Server-safe and surface-neutral. */
export function SystemPageView({ page, facts, surface = "next", link = plainLink }: ViewProps) {
  return (
    <article
      data-slot="system-page"
      className="text-foreground mx-auto w-full max-w-3xl space-y-10 px-6 py-10 wrap-anywhere"
    >
      <header className="space-y-4">
        <h1 data-slot="system-page-title" className="text-3xl font-bold">
          {page.title}
        </h1>
        {page.draft ? (
          <p role="note" data-slot="system-page-draft" className="rounded-md border px-3 py-2 text-sm">
            Draft. The prose on this page is under review.
          </p>
        ) : null}
        {page.lede.map((paragraph) => (
          <p key={paragraph} className="leading-7">
            <InlineProse text={resolveFacts(paragraph, facts)} />
          </p>
        ))}
      </header>
      {page.sections.map((section, index) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-heading`}
          className="space-y-4"
        >
          <h2 id={`${section.id}-heading`} className="text-lg font-semibold">
            <span className="text-muted-foreground mr-2 tabular-nums">{index + 1}</span>
            {section.heading}
          </h2>
          {section.blocks.map((block, blockIndex) => (
            <Block key={blockIndex} block={block} facts={facts} surface={surface} link={link} />
          ))}
        </section>
      ))}
    </article>
  );
}
