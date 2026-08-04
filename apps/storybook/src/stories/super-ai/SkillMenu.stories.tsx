import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileText, Languages, Mic, Wand2 } from "lucide-react";

import { SkillMenu, type SkillMenuItem } from "@/registry/super-ai/skill-menu";
import { SkillMenuDocs } from "@/content/components/skill-menu.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof SkillMenu> = {
  title: "Super AI/Skill Menu",
  component: SkillMenu,
  parameters: { layout: "centered", docs: { page: componentDocsPage(SkillMenuDocs) } },
};

export default meta;
type Story = StoryObj<typeof SkillMenu>;

const SKILLS: SkillMenuItem[] = [
  {
    id: "summarize",
    title: "Summarize",
    description: "Condense a long document into key points",
    icon: <FileText aria-hidden />,
    preview: (
      <div className="space-y-1 text-sm">
        <p className="font-medium">Preview</p>
        <p className="text-muted-foreground">
          "The Q3 report shows revenue up 12%, driven mainly by the new APAC region..."
        </p>
      </div>
    ),
  },
  {
    id: "translate",
    title: "Translate",
    description: "Convert text between languages while preserving tone",
    icon: <Languages aria-hidden />,
    cost: 1,
    preview: (
      <div className="space-y-1 text-sm">
        <p className="font-medium">Preview</p>
        <p className="text-muted-foreground">"El informe del tercer trimestre muestra un aumento del 12%..."</p>
      </div>
    ),
  },
  {
    id: "voiceover",
    title: "Generate voiceover",
    description: "Turn a script into narration with a natural-sounding voice",
    icon: <Mic aria-hidden />,
    cost: 4,
    preview: <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-sm">Preview: waveform</div>,
  },
  {
    id: "remove-bg",
    title: "Remove background",
    description: "Cut a subject out onto a transparent background",
    icon: <Wand2 aria-hidden />,
    preview: <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-sm">Preview: cutout result</div>,
  },
];

export const Search: Story = {
  args: { skills: SKILLS, searchPlaceholder: "Search skills..." },
};

export const HoverPreview: Story = {
  args: { skills: SKILLS },
};

export const NewSkillFooter: Story = {
  args: {
    skills: SKILLS,
    createLabel: "Create your own",
    generateLabel: "Have the agent build it",
    onCreateSkill: () => {},
    onGenerateSkill: () => {},
  },
};
