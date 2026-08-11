import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskTray, type TrayTask } from "./task-tray";

const TASKS: TrayTask[] = [
  { id: "a", title: "Reindex library", status: "done" },
  { id: "b", title: "Draft summary", status: "running" },
  { id: "c", title: "Send renewal notice", status: "needs-input" },
  { id: "d", title: "Export report", status: "failed" },
];

const rows = () =>
  // EntityRow's own slot, not a task-tray override — task-tray no longer
  // renames it (G2: overriding it would erase EntityRow's identity in the
  // DOM). Rows are addressed by data-task-id; sorted here by data-status.
  Array.from(document.querySelectorAll('[data-slot="entity-row"]')).map((el) => el.getAttribute("data-status")!);

describe("TaskTray", () => {
  it("sorts needs-input to the top — blocked work is the only row you must act on", () => {
    render(<TaskTray open tasks={TASKS} />);
    expect(rows()).toEqual(["needs-input", "failed", "running", "done"]);
  });

  it("counts what is waiting on the user in the header", () => {
    render(<TaskTray open tasks={TASKS} />);
    expect(screen.getByText("1 waiting on you")).toBeInTheDocument();
  });

  it("offers cancel only while a task can still be stopped", () => {
    render(<TaskTray open tasks={TASKS} onCancelTask={() => {}} />);
    // running + needs-input are live; done and failed are over.
    expect(screen.getAllByRole("button", { name: "Cancel task" })).toHaveLength(2);
  });

  it("never nests a button inside the row button", () => {
    // EntityRow renders a <button> when it has onSelect, so per-task controls
    // must be siblings of the row, not children of it. Nested buttons are
    // invalid HTML and blow up as a hydration error in the browser — which the
    // behavioural tests below cannot see.
    render(<TaskTray open tasks={TASKS} onOpenTask={() => {}} onCancelTask={() => {}} />);
    for (const button of Array.from(document.querySelectorAll("button"))) {
      expect(button.querySelector("button")).toBeNull();
    }
  });

  it("does not navigate when a control beside the row is used", async () => {
    const onOpenTask = vi.fn();
    const onCancelTask = vi.fn();
    render(
      <TaskTray
        open
        tasks={[{ id: "b", title: "Draft summary", status: "running" }]}
        onOpenTask={onOpenTask}
        onCancelTask={onCancelTask}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel task" }));
    expect(onCancelTask).toHaveBeenCalledWith("b");
    expect(onOpenTask).not.toHaveBeenCalled();
  });

  it("makes the completion notification per-task, not a global setting", async () => {
    const onNotifyChange = vi.fn();
    render(
      <TaskTray
        open
        tasks={[{ id: "b", title: "Draft summary", status: "running", notify: false }]}
        onNotifyChange={onNotifyChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Notify me when done" }));
    expect(onNotifyChange).toHaveBeenCalledWith("b", true);
  });

  it("announces status to assistive tech, since the icon carries it visually", () => {
    render(<TaskTray open tasks={[{ id: "d", title: "Export report", status: "failed" }]} />);
    const row = document.querySelector('[data-slot="entity-row"]')! as HTMLElement;
    expect(within(row).getByText("Failed.")).toBeInTheDocument();
  });

  it("explains what the tray is for when it is empty", () => {
    render(<TaskTray open tasks={[]} />);
    expect(screen.getByText(/Tasks you start in the background collect here/)).toBeInTheDocument();
  });
});
