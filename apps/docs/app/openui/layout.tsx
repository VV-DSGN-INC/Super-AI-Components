import { DocsShell } from "@/components/docs-shell";

export default function OpenUILayout({ children }: { children: React.ReactNode }) {
  return <DocsShell>{children}</DocsShell>;
}
