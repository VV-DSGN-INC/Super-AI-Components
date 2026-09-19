import type { Metadata } from "next";
import Link from "next/link";

import { SystemPageView, type LinkRenderer } from "@/components/system/system-page";
import { architecturePage } from "@/content/system/architecture.page";
import facts from "@/content/system/facts.json";

export const metadata: Metadata = {
  title: architecturePage.title,
  description: architecturePage.description,
};

const link: LinkRenderer = (props) => <Link {...props} />;

export default function ArchitectureRoute() {
  return <SystemPageView page={architecturePage} facts={facts} link={link} />;
}
