import type { Metadata } from "next";

import { ComponentPage } from "@/components/pages/component-page";
import { CATALOG } from "@/lib/catalog";
import { localeHref } from "@/lib/i18n/paths";
import { MARKETING } from "@/lib/marketing-catalog";

export function generateStaticParams() {
  return [...CATALOG, ...MARKETING].map((name) => ({ name }));
}

// Per-component hreflang: the root layout's alternates apply site-wide and are
// only correct for "/", so each component page must point crawlers at its own
// mirror rather than inheriting the homepage's "/ru".
export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const path = `/components/${name}`;
  return { alternates: { languages: { en: localeHref("en", path), ru: localeHref("ru", path) } } };
}

export default async function Page({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  return <ComponentPage locale="ru" name={name} />;
}
