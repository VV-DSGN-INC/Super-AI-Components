import Link from "next/link";
import { notFound } from "next/navigation";

import { getPatternPage, PATTERN_PAGES, SOURCES, STANDING_LINE } from "@/lib/patterns";

export function generateStaticParams() {
  return PATTERN_PAGES.map((p) => ({ slug: p.slug }));
}

export default async function PatternPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getPatternPage(slug);
  if (!page) notFound();

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      <header>
        <p className="text-xs font-medium uppercase text-muted-foreground">Pattern</p>
        <h1 className="mt-1 text-3xl font-bold">{page.title}</h1>
        <p className="mt-2 text-muted-foreground">{page.intro}</p>
        <p className="mt-3 rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">{STANDING_LINE}</p>
      </header>

      <section>
        <h2 className="text-xl font-semibold">Patterns in this group</h2>
        <dl className="mt-3 flex flex-col gap-3">
          {page.patterns.map((p) => (
            <div key={p.name}>
              <dt className="text-sm font-medium">{p.name}</dt>
              <dd className="text-sm text-muted-foreground">{p.definition}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">{SOURCES}</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">UX implications</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {page.uxImplications.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Component mapping</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-muted-foreground">
              <th scope="col" className="py-2 pr-4 font-medium">Component</th>
              <th scope="col" className="py-2 font-medium">When to use</th>
            </tr>
          </thead>
          <tbody>
            {page.mappings.map((m) => (
              <tr key={m.component} className="border-b last:border-0 align-top">
                <td className="py-2 pr-4">
                  {m.href.startsWith("http") ? (
                    <a
                      href={m.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 hover:text-foreground"
                    >
                      {m.component}
                    </a>
                  ) : (
                    <Link href={m.href} className="underline underline-offset-4 hover:text-foreground">
                      {m.component}
                    </Link>
                  )}
                </td>
                <td className="py-2 text-muted-foreground">{m.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-xl font-semibold">States checklist</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {page.states.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Do / Don&apos;t</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {page.dos.map((pair) => (
            <li key={pair.do} className="rounded-md border p-3">
              <p>
                <span className="font-medium text-primary">Do</span> {pair.do}
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium text-destructive">Don&apos;t</span> {pair.dont}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
