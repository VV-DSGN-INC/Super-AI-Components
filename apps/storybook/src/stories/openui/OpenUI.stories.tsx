import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { BOARD, OWNERS, STATUSES } from "@/components/openui/fixtures";
import { exposedSurfaces } from "@/components/openui/library";
import { ExposedSurfacesTable, OpenUIConversation, SystemPromptView } from "@/components/openui/openui-demo";

/**
 * The docs site's /openui demo, one story per section, so the a11y gate
 * renders what the page renders: registry components driven by OpenUI's
 * runtime over recorded OpenUI Lang. No model is called. This file lives
 * outside `stories/super-ai/` on purpose: the contract gates map catalog names
 * to that folder, and the demo is not a catalog item.
 */
const meta: Meta = {
  title: "Docs/OpenUI",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

const first = BOARD[0]!;
const STREAM = { timeout: 8000 };

/**
 * The first turn streams on mount; its Button produces the form turn; the form
 * submits through `onAction` and the answer is built from what was typed and
 * picked. The play ends on a settled turn, so axe scans no half-drawn tree.
 */
export const Conversation: Story = {
  render: () => <OpenUIConversation streamMs={30} className="h-[42rem]" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByRole("cell", { name: first.title })).toBeInTheDocument(), STREAM);
    const add = await waitFor(() => canvas.getByRole("button", { name: "Add a task" }), STREAM);
    await userEvent.click(add);

    const title = await waitFor(() => canvas.getByRole("textbox", { name: "Task" }), STREAM);
    await waitFor(() => expect(canvas.getByRole("button", { name: "Add task" })).toBeEnabled(), STREAM);
    await userEvent.type(title, "Review the catalog emitter");
    await userEvent.click(canvas.getByRole("radio", { name: OWNERS[0]! }));
    await userEvent.click(canvas.getByRole("radio", { name: STATUSES[0]! }));
    await userEvent.click(canvas.getByRole("button", { name: "Add task" }));

    await waitFor(() => expect(canvas.getByText("New task")).toBeInTheDocument(), STREAM);
    await waitFor(
      () => expect(canvas.getByRole("button", { name: "Where do the tasks stand?" })).toBeInTheDocument(),
      STREAM,
    );
  },
};

/** The generated prompt in a focusable scroll region, with its size. */
export const SystemPrompt: Story = {
  parameters: { layout: "padded" },
  render: () => <SystemPromptView />,
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region", { name: "Generated system prompt" });
    await expect(region.textContent).toContain("root = Page(");
  },
};

/** One row per exposed surface, naming the registry item behind it. */
export const Surfaces: Story = {
  parameters: { layout: "padded" },
  render: () => <ExposedSurfacesTable />,
  play: async ({ canvasElement }) => {
    const rows = within(canvasElement).getAllByRole("row");
    await expect(rows.length).toBe(exposedSurfaces.length + 1);
  },
};

/**
 * 375×812 through `page.viewport`, which moves `innerWidth` so the chat
 * shell's drawer branch renders (a width wrapper would keep the desktop rail).
 * Nothing scrolls sideways: not the document, not the message stream. Last in
 * the file so the resize cannot reach a story after it.
 */
export const Narrow: Story = {
  render: () => <OpenUIConversation streamMs={30} className="h-[42rem]" />,
  play: async ({ canvasElement }) => {
    const { page } = await import("vitest/browser");
    await page.viewport(375, 812);
    const canvas = within(canvasElement);
    await waitFor(() => expect(window.innerWidth).toBe(375));
    await waitFor(
      () =>
        expect(
          canvas.getByRole("button", { name: "Which sources back the imaging answer?" }),
        ).toBeInTheDocument(),
      STREAM,
    );
    const stream = canvasElement.querySelector<HTMLElement>('[data-region="message-stream"]')!;
    await expect(
      `document ${document.documentElement.scrollWidth <= 375} · stream ${stream.scrollWidth <= stream.clientWidth}`,
    ).toBe("document true · stream true");
  },
};
