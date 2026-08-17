import type { Metadata } from "next";

import { bodyClassName, htmlClassName } from "@/components/pages/root-shell";
import "../globals.css";

export const metadata: Metadata = {
  title: "Super-AI-Components",
  description:
    "A shadcn registry of components for AI applications — app shells, creative studios, feedback loops, observability, and monetization UI.",
  alternates: { languages: { en: "/", ru: "/ru" } },
};

export default function EnRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={htmlClassName}>
      <body className={bodyClassName}>{children}</body>
    </html>
  );
}
