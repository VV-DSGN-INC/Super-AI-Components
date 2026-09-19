import type { Metadata } from "next";
import Link from "next/link";

import { SystemPageView, type LinkRenderer } from "@/components/system/system-page";
import facts from "@/content/system/facts.json";
import { harnessPage } from "@/content/system/harness.page";

export const metadata: Metadata = { title: harnessPage.title, description: harnessPage.description };

const link: LinkRenderer = (props) => <Link {...props} />;

export default function HarnessRoute() {
  return <SystemPageView page={harnessPage} facts={facts} link={link} />;
}
