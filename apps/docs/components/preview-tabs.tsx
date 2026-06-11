"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PreviewTabsProps {
  preview: React.ReactNode;
  code: string;
}

export function PreviewTabs({ preview, code }: PreviewTabsProps) {
  return (
    <Tabs defaultValue="preview">
      <TabsList>
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
      </TabsList>
      <TabsContent value="preview">
        <div className="flex min-h-40 items-center justify-center rounded-xl border p-8">{preview}</div>
      </TabsContent>
      <TabsContent value="code">
        <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-xs">
          <code>{code}</code>
        </pre>
      </TabsContent>
    </Tabs>
  );
}
