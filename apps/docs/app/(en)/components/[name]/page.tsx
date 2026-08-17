import { ComponentPage } from "@/components/pages/component-page";
import { CATALOG } from "@/lib/catalog";
import { MARKETING } from "@/lib/marketing-catalog";

export function generateStaticParams() {
  return [...CATALOG, ...MARKETING].map((name) => ({ name }));
}

export default async function Page({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  return <ComponentPage locale="en" name={name} />;
}
