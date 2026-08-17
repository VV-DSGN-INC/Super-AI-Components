import type { Metadata } from "next";

import { RootShell } from "@/components/pages/root-shell";
import "../globals.css";

export const metadata: Metadata = {
  title: "Super-AI-Components",
  description:
    "Реестр shadcn с компонентами для ИИ-приложений — оболочки приложений, творческие студии, обратная связь, наблюдаемость и монетизация интерфейса.",
  alternates: { languages: { en: "/", ru: "/ru" } },
};

export default function RuRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootShell locale="ru">{children}</RootShell>;
}
