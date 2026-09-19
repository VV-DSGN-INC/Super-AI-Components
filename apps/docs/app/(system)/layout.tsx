import { DocsShell } from "@/components/docs-shell";

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  return <DocsShell>{children}</DocsShell>;
}
