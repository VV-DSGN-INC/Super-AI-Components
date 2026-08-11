"use client";

import { Clapperboard, Image as ImageIcon, Mic, Sparkles, Type, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HomeShell, type HomeShellProps } from "@/registry/super-ai/home-shell";
import { SidebarNav } from "@/registry/super-ai/sidebar-nav";

const NAV = [
  {
    label: "Workspace",
    items: [
      { id: "home", label: "Home", icon: <Sparkles /> },
      { id: "projects", label: "Projects", icon: <Clapperboard />, count: 12 },
      { id: "assets", label: "Assets", icon: <ImageIcon /> },
    ],
  },
];

const SUGGESTIONS = [
  { id: "s1", suggestion: "Draft a launch announcement", icon: <Type /> },
  { id: "s2", suggestion: "Turn the Q3 deck into a narrated video", icon: <Clapperboard /> },
  { id: "s3", suggestion: "Clean up the audio on this interview", icon: <Mic /> },
];

const FEATURES: HomeShellProps["features"] = [
  {
    id: "image",
    icon: <ImageIcon />,
    title: "Generate images",
    description: "From a prompt, a sketch or a reference frame.",
  },
  {
    id: "video",
    icon: <Clapperboard />,
    title: "Edit video",
    description: "Cut, caption and export without leaving the browser.",
  },
  {
    id: "voice",
    icon: <Mic />,
    title: "Clone a voice",
    description: "Thirty seconds of clean audio is enough.",
  },
  {
    id: "restyle",
    icon: <WandSparkles />,
    title: "Restyle a project",
    description: "Apply one look across every asset at once.",
  },
];

const RECENTS = [
  { id: "r1", title: "Northwind brand audit", editedAgo: "Edited 19 hours ago" },
  { id: "r2", title: "Q3 launch film", durationLabel: "12:04", editedAgo: "Edited 2 days ago" },
  { id: "r3", title: "Pricing page hero", editedAgo: "Edited 4 days ago" },
  { id: "r4", title: "Onboarding voiceover", durationLabel: "03:41", editedAgo: "Edited last week" },
];

const RECOMMENDATIONS: HomeShellProps["recommendations"] = [
  {
    id: "digest",
    icon: <Sparkles />,
    title: "Turn new uploads into a Friday digest",
    description: "Watches a folder and writes the week up for you.",
    apps: ["Drive", "Slack"],
    steps: [
      "Watch the Northwind shared folder",
      "Summarise anything that lands in it",
      "Post the summary to #northwind every Friday",
    ],
    onDismiss: () => {},
    onTry: () => {},
  },
  {
    id: "subtitles",
    icon: <Clapperboard />,
    title: "Subtitle every export automatically",
    description: "Adds burned-in captions in the project's language.",
    apps: ["Projects"],
    steps: ["Detect the spoken language", "Generate captions", "Burn them into the export"],
    onDismiss: () => {},
    onTry: () => {},
  },
];

export default function HomeShellDemo() {
  return (
    <HomeShell
      className="h-[42rem]"
      title="Northwind"
      headline="Good afternoon"
      switcher={<div className="px-2 text-sm font-medium">Northwind</div>}
      nav={<SidebarNav sections={NAV} activeId="home" />}
      credits={{ balance: 420, total: 1000, form: "ring", onManage: () => {} }}
      omnibox={{
        models: [
          { value: "fast", label: "Fast" },
          { value: "quality", label: "Quality" },
        ],
        model: "fast",
        cost: 4,
      }}
      suggestions={SUGGESTIONS}
      suggestionsOverflow={{ href: "#", count: 12 }}
      features={FEATURES}
      featuresAction={
        <a href="#" className="underline-offset-4 hover:underline">
          View all
        </a>
      }
      recents={RECENTS}
      recentsEmptyAction={<Button size="sm">New project</Button>}
      recommendations={RECOMMENDATIONS}
    />
  );
}
