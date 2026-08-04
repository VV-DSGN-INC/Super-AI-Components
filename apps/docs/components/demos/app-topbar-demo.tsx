"use client";

import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppTopbar } from "@/registry/super-ai/app-topbar";

export default function AppTopbarDemo() {
  return (
    <AppTopbar
      context="document"
      title="Q3 Roadmap"
      breadcrumb={[
        { label: "Projects", href: "#" },
        { label: "Marketing", href: "#" },
        { label: "Q3 Roadmap" },
      ]}
      privacy={{ label: "Private" }}
      savedLabel="Last saved 5 days ago"
      actions={
        <Button size="sm" variant="outline">
          <Share2 />
          Share
        </Button>
      }
    />
  );
}
