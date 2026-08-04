import type { Meta, StoryObj } from "@storybook/react-vite";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar, type AppSidebarProps } from "@/registry/super-ai/app-sidebar";
import { AppSidebarDocs } from "@/content/components/app-sidebar.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { SidebarNav } from "@/registry/super-ai/sidebar-nav";
import { WorkspaceSwitcher } from "@/registry/super-ai/workspace-switcher";
import { PromoCard } from "@/registry/super-ai/promo-card";

const WORKSPACES = [
  { id: "acme", name: "Acme", plan: "Pro" },
  { id: "personal", name: "Personal", plan: "Free" },
];

const NAV_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { id: "chat", label: "Chat", count: 3 },
      { id: "library", label: "Library", tier: "Pro" },
      { id: "inbox", label: "Inbox", unread: true },
    ],
  },
];

// AppSidebar expects a SidebarProvider ancestor — that's mechanics the
// consumer's shell owns (see the component's own docs), not something the
// component bundles itself. Every story supplies it, with `defaultOpen`
// standing in for the shell decision between expanded and icon-rail.
function AppSidebarShell({ defaultOpen, ...args }: AppSidebarProps & { defaultOpen: boolean }) {
  return (
    <div className="h-96 w-full max-w-sm overflow-hidden rounded-lg border">
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar {...args} />
        <SidebarInset className="flex items-center gap-2 p-3">
          <SidebarTrigger />
          <p className="text-muted-foreground text-sm">Main content</p>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

const meta: Meta<typeof AppSidebar> = {
  title: "Super AI/App Sidebar",
  component: AppSidebar,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AppSidebarDocs) } },
};

export default meta;
type Story = StoryObj<typeof AppSidebar>;

const FULL_ARGS: AppSidebarProps = {
  switcher: <WorkspaceSwitcher workspaces={WORKSPACES} currentId="acme" onSelect={() => {}} />,
  nav: <SidebarNav sections={NAV_SECTIONS} activeId="chat" />,
  promo: (
    <PromoCard
      flavour="upgrade"
      title="Upgrade to Pro"
      ctaLabel="Upgrade"
      onCtaClick={() => {}}
      onDismiss={() => {}}
    />
  ),
  footer: <div className="text-muted-foreground px-2 text-xs">nick@acme.com</div>,
};

export const Expanded: Story = {
  args: FULL_ARGS,
  render: (args) => <AppSidebarShell {...args} defaultOpen />,
};

export const IconRail: Story = {
  args: FULL_ARGS,
  render: (args) => <AppSidebarShell {...args} defaultOpen={false} />,
};

export const MobileDrawer: Story = {
  args: {
    switcher: <WorkspaceSwitcher workspaces={WORKSPACES} currentId="acme" onSelect={() => {}} />,
    nav: <SidebarNav sections={NAV_SECTIONS} activeId="chat" />,
  },
  render: (args) => <AppSidebarShell {...args} defaultOpen />,
  parameters: {
    // Below the sidebar's mobile breakpoint (768px) the vendored Sidebar
    // swaps to a Sheet-based drawer automatically, gated on the real browser
    // viewport width — resize the canvas below that width (or preview on a
    // narrow viewport) and use the trigger above to open it.
    viewport: { defaultViewport: "mobile1" },
  },
};
