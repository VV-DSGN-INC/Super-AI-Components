import { DocsLayout } from "@/components/pages/docs-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DocsLayout locale="en">{children}</DocsLayout>;
}
