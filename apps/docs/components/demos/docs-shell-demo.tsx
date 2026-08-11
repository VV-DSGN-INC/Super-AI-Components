"use client";

import { AudioLines, Blocks, Image as ImageIcon, Rocket } from "lucide-react";

import { DocsShell } from "@/registry/super-ai/docs-shell";

const AREAS = [
  { id: "platform", label: "Platform", icon: <Blocks /> },
  { id: "images", label: "Image models", icon: <ImageIcon /> },
  { id: "audio", label: "Audio models", icon: <AudioLines /> },
  { id: "deploy", label: "Deploy", icon: <Rocket /> },
];

const NAV_SECTIONS = [
  {
    label: "Get started",
    items: [
      { id: "quickstart", label: "Quickstart" },
      { id: "authentication", label: "Authentication" },
      { id: "rate-limits", label: "Rate limits", tier: "Pro" },
    ],
  },
  {
    label: "Generate",
    items: [
      { id: "text-to-image", label: "Text to image" },
      { id: "image-to-image", label: "Image to image" },
      { id: "upscale", label: "Upscale", count: 2 },
    ],
  },
  {
    label: "Reference",
    items: [
      { id: "errors", label: "Errors" },
      { id: "changelog", label: "Changelog", unread: true },
      { id: "status", label: "Status page", href: "https://example.com/status", external: true },
    ],
  },
];

const SECTIONS = [
  {
    id: "overview",
    title: "Overview",
    body: "Every image request is a POST to /v1/images with a JSON body. The response streams progress events until the final asset URL arrives, so a client can show partial results without polling.",
  },
  {
    id: "sizes",
    title: "Supported sizes",
    body: "Square, portrait and landscape are billed identically. Anything above 2048px on the long edge is billed at the upscale rate, whether or not you asked for an upscale.",
    citations: [
      {
        id: "pricing",
        label: "1",
        source: "Pricing — image generation",
        quote: "Outputs above 2048px on the long edge bill at the upscale rate.",
      },
    ],
  },
  {
    id: "errors",
    title: "Errors",
    body: "A 429 carries a Retry-After header in seconds. A 402 means the workspace is out of credits and will not clear on its own.",
    citations: [
      {
        id: "rfc",
        label: "2",
        source: "RFC 6585 §4",
        quote: "The 429 status code indicates that the user has sent too many requests.",
      },
      { id: "orphan", label: "3", state: "unresolved" as const },
    ],
  },
];

export default function DocsShellDemo() {
  return (
    <DocsShell
      className="h-[42rem]"
      railBrand={<div className="px-1 text-sm font-medium">Northwind</div>}
      areas={AREAS}
      activeAreaId="images"
      navSections={NAV_SECTIONS}
      activePageId="text-to-image"
      announcements={[
        {
          id: "streaming-2026-08",
          title: "Streaming image progress",
          description: "Partial frames now arrive before the final asset.",
          stage: "Beta",
          ctaLabel: "Read the guide",
        },
      ]}
      title="Text to image"
      lede="Generate an image from a prompt, with optional reference images and a seed for reproducibility."
      sections={SECTIONS}
    />
  );
}
