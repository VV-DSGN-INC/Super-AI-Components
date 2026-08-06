import type { Meta, StoryObj } from "@storybook/react-vite";
import { LayoutTemplate } from "lucide-react";

import { TemplateDetail, type TemplateDetailTemplate } from "@/registry/super-ai/template-detail";
import { TemplateDetailDocs } from "@/content/components/template-detail.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

/**
 * Decorative stand-in art. `aria-hidden` so a thumbnail's accessible name stays
 * its preview label rather than "Cover Cover".
 */
function Art({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      className="bg-foreground/10 text-foreground flex h-full w-full items-center justify-center gap-2 text-xs"
    >
      <LayoutTemplate aria-hidden className="size-4" />
      {label}
    </div>
  );
}

const PITCH: TemplateDetailTemplate = {
  id: "pitch",
  title: "Minimal pitch deck",
  description: "Twelve slides, one idea per slide. Built for a ten-minute room.",
  previews: [
    { id: "cover", label: "Cover", media: <Art label="Cover" /> },
    { id: "problem", label: "Problem", media: <Art label="Problem" /> },
    { id: "metrics", label: "Metrics", media: <Art label="Metrics" /> },
    { id: "ask", label: "Ask", media: <Art label="Ask" /> },
  ],
  options: [
    {
      id: "size",
      label: "Size",
      choices: [
        { value: "16-9", label: "16:9 widescreen" },
        { value: "4-3", label: "4:3 standard" },
      ],
    },
    {
      id: "length",
      label: "Slides",
      defaultValue: "12",
      hint: "Extra slides are added as blanks after the ask.",
      choices: [
        { value: "8", label: "8 slides" },
        { value: "12", label: "12 slides" },
        { value: "20", label: "20 slides" },
      ],
    },
  ],
  author: { id: "marta", name: "Marta Lin", meta: "148 templates" },
  thumbnail: <Art label="Pitch" />,
};

const REPORT: TemplateDetailTemplate = {
  id: "report",
  title: "Quarterly report",
  description: "A print-ready long-form layout with a numbers appendix.",
  previews: [
    { id: "cover", label: "Cover", media: <Art label="Report cover" /> },
    { id: "tables", label: "Tables", media: <Art label="Tables" /> },
  ],
  options: [
    {
      id: "size",
      label: "Paper",
      choices: [
        { value: "a4", label: "A4" },
        { value: "letter", label: "US Letter" },
      ],
    },
  ],
  author: { id: "dev", name: "Dev Okafor", meta: "31 templates" },
  thumbnail: <Art label="Report" />,
};

const POSTER: TemplateDetailTemplate = {
  id: "poster",
  title: "Event poster",
  description: "One loud headline, one date, one QR code.",
  previews: [{ id: "poster", label: "Poster", media: <Art label="Poster" /> }],
  options: [
    {
      id: "size",
      label: "Size",
      choices: [
        { value: "a2", label: "A2" },
        { value: "a1", label: "A1" },
      ],
    },
  ],
  author: { id: "marta", name: "Marta Lin", meta: "148 templates" },
  thumbnail: <Art label="Poster" />,
};

const POOL = [PITCH, REPORT, POSTER];

const meta: Meta<typeof TemplateDetail> = {
  title: "Super AI/Template Detail",
  component: TemplateDetail,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TemplateDetailDocs) } },
  args: {
    open: true,
    templates: POOL,
    onUseTemplate: () => {},
    onFollowChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof TemplateDetail>;

/** The preview at full size over a carousel of thumbnails; the current one carries aria-current. */
export const PreviewStrip: Story = {};

/** Size, length and language are chosen here, so the commit carries a configured template. */
export const OptionSelects: Story = {
  args: {
    templates: [
      {
        ...PITCH,
        options: [
          ...PITCH.options!,
          {
            id: "language",
            label: "Language",
            defaultValue: "en",
            choices: [
              { value: "en", label: "English" },
              { value: "de", label: "German" },
              { value: "ja", label: "Japanese" },
            ],
          },
        ],
      },
      REPORT,
      POSTER,
    ],
  },
};

/** The author is next to the work, and follow names them rather than repeating "Follow". */
export const AuthorFollow: Story = {
  args: {
    templates: [{ ...PITCH, author: { ...PITCH.author!, following: true } }, REPORT, POSTER],
  },
};

/** Picking a neighbour swaps the modal in place — the session never dead-ends. */
export const MoreLikeThis: Story = {
  args: {
    // Starts on the single-preview poster, so the row of neighbours is the
    // thing on screen — and it is uncontrolled, so clicking one really swaps.
    defaultTemplateId: "poster",
    onTemplateChange: () => {},
  },
};
