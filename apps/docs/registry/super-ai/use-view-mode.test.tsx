import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DETAIL_MODE_STORAGE_KEY,
  VIEW_MODE_STORAGE_KEY,
  VIEW_MODE_VALUES,
  availableViewModes,
  isDetailMode,
  isViewMode,
  usePersistedPreference,
  useDetailMode,
  useViewMode,
} from "@/registry/super-ai/use-view-mode";

type Size = "sm" | "lg";
const isSize = (v: unknown): v is Size => v === "sm" || v === "lg";

describe("view mode defaults", () => {
  it("accepts the time views as view modes", () => {
    expect(isViewMode("calendar")).toBe(true);
    expect(isViewMode("timeline")).toBe(true);
  });

  it("still rejects unknown values", () => {
    expect(isViewMode("gantt")).toBe(false);
    expect(isViewMode(null)).toBe(false);
    expect(isViewMode(3)).toBe(false);
  });

  it("offers only the untimed views when a section has no time capability", () => {
    expect(availableViewModes(false)).toEqual(["list", "kanban", "table"]);
  });

  it("offers every view when a section is time-capable", () => {
    expect(availableViewModes(true)).toEqual(VIEW_MODE_VALUES);
  });

  it("keeps the default reachable without time capability", () => {
    expect(availableViewModes(false)).toContain("kanban");
  });

  it("orders time views last so existing arrow-key muscle memory survives", () => {
    expect(VIEW_MODE_VALUES.indexOf("calendar")).toBeGreaterThan(VIEW_MODE_VALUES.indexOf("table"));
  });

  it("namespaces storage keys per section and per entity", () => {
    expect(VIEW_MODE_STORAGE_KEY("tasks")).toBe("super-ai.view-mode.tasks");
    expect(DETAIL_MODE_STORAGE_KEY("task")).toBe("super-ai.detail-mode.task");
    // The two axes must never collide on a key, or one would overwrite the other.
    expect(VIEW_MODE_STORAGE_KEY("x")).not.toBe(DETAIL_MODE_STORAGE_KEY("x"));
  });

  it("validates detail modes", () => {
    expect(isDetailMode("overlay")).toBe(true);
    expect(isDetailMode("drawer")).toBe(false);
  });
});

describe("usePersistedPreference", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("falls back to the default when nothing is stored", () => {
    const { result } = renderHook(() => usePersistedPreference("k", "sm" as Size, isSize));
    expect(result.current[0]).toBe("sm");
  });

  it("reads a valid stored value on mount", () => {
    window.localStorage.setItem("k", "lg");
    const { result } = renderHook(() => usePersistedPreference("k", "sm" as Size, isSize));
    expect(result.current[0]).toBe("lg");
  });

  it("ignores an invalid stored value and uses the default", () => {
    window.localStorage.setItem("k", "xl");
    const { result } = renderHook(() => usePersistedPreference("k", "sm" as Size, isSize));
    expect(result.current[0]).toBe("sm");
  });

  it("writes through to localStorage on change", () => {
    const { result } = renderHook(() => usePersistedPreference("k", "sm" as Size, isSize));
    act(() => result.current[1]("lg"));
    expect(window.localStorage.getItem("k")).toBe("lg");
  });

  it("syncs from a storage event for the same key", () => {
    const { result } = renderHook(() => usePersistedPreference("k", "sm" as Size, isSize));
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "k", newValue: "lg" }));
    });
    expect(result.current[0]).toBe("lg");
  });

  it("ignores storage events for other keys and invalid values", () => {
    const { result } = renderHook(() => usePersistedPreference("k", "sm" as Size, isSize));
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "other", newValue: "lg" }));
      window.dispatchEvent(new StorageEvent("storage", { key: "k", newValue: "xl" }));
    });
    expect(result.current[0]).toBe("sm");
  });

  it("resets to the fallback when another tab removes the key", () => {
    window.localStorage.setItem("k", "lg");
    const { result } = renderHook(() => usePersistedPreference("k", "sm" as Size, isSize));
    expect(result.current[0]).toBe("lg");
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "k", newValue: null }));
    });
    expect(result.current[0]).toBe("sm");
  });

  describe("a changed key", () => {
    it("re-reads the value from the new key", () => {
      window.localStorage.setItem("a", "sm");
      window.localStorage.setItem("b", "lg");
      const { result, rerender } = renderHook(
        ({ k }: { k: string }) => usePersistedPreference(k, "sm" as Size, isSize),
        { initialProps: { k: "a" } },
      );
      expect(result.current[0]).toBe("sm");
      rerender({ k: "b" });
      expect(result.current[0]).toBe("lg");
    });

    it("does not carry the old key's value into the new key on write", () => {
      window.localStorage.setItem("a", "lg");
      const { result, rerender } = renderHook(
        ({ k }: { k: string }) => usePersistedPreference(k, "sm" as Size, isSize),
        { initialProps: { k: "a" } },
      );
      rerender({ k: "b" });
      act(() => result.current[1]("sm"));
      expect(window.localStorage.getItem("b")).toBe("sm");
      expect(window.localStorage.getItem("a")).toBe("lg");
    });
  });

  describe("when storage throws", () => {
    it("returns the fallback if getItem throws", () => {
      const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("denied");
      });
      const { result } = renderHook(() => usePersistedPreference("k", "sm" as Size, isSize));
      expect(result.current[0]).toBe("sm");
      spy.mockRestore();
    });

    it("still updates in memory if setItem throws", () => {
      const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("full");
      });
      const { result } = renderHook(() => usePersistedPreference("k", "sm" as Size, isSize));
      act(() => result.current[1]("lg"));
      expect(result.current[0]).toBe("lg");
      spy.mockRestore();
    });
  });

  describe("the storage listener", () => {
    it("is removed on unmount", () => {
      const remove = vi.spyOn(window, "removeEventListener");
      const { unmount } = renderHook(() => usePersistedPreference("k", "sm" as Size, isSize));
      unmount();
      expect(remove).toHaveBeenCalledWith("storage", expect.any(Function));
      remove.mockRestore();
    });

    it("is not resubscribed when isValid changes identity", () => {
      const add = vi.spyOn(window, "addEventListener");
      const { rerender } = renderHook(() =>
        // A fresh arrow every render — the ref indirection is what stops this
        // tearing down and re-adding the listener each time.
        usePersistedPreference("k", "sm" as Size, (v): v is Size => v === "sm" || v === "lg"),
      );
      const before = add.mock.calls.filter(([type]) => type === "storage").length;
      rerender();
      rerender();
      const after = add.mock.calls.filter(([type]) => type === "storage").length;
      expect(after).toBe(before);
      add.mockRestore();
    });
  });

  /* The header comment promises the hook is inert on a server. Stubbing
     `window` away makes every guard take the server path, so an unguarded
     access fails here instead of in production SSR. The upstream shell proved
     this with a second test file pinned to the node environment. That pin is a
     per-file docblock directive, and a second test file in this directory
     would read as an orphan to the contract gate anyway — so the guarantee is
     asserted here instead.

     Do not write the directive's literal name in this file, even inside a
     comment: vitest scans the source for it and would switch this entire file
     to the node environment, breaking every jsdom test above. */
  describe("without a window", () => {
    /**
     * `vi.stubGlobal("window", …)` is not usable here: jsdom's window is not an
     * ordinary global, and unstubbing leaves a replacement whose `localStorage`
     * is gone, which breaks every later suite in this file. Deleting the key
     * and restoring the original reference by hand is the only form that puts
     * the environment back exactly as it was.
     */
    function withoutWindow(fn: () => void) {
      const realWindow = globalThis.window;
      // @ts-expect-error — deliberately removing window to take the server path
      delete globalThis.window;
      try {
        fn();
      } finally {
        globalThis.window = realWindow;
      }
    }

    it("renders the fallback on the server without throwing", () => {
      withoutWindow(() => {
        function Probe() {
          const [value] = usePersistedPreference("k", "sm" as Size, isSize);
          return <span>{value}</span>;
        }
        let html = "";
        expect(() => {
          html = renderToString(<Probe />);
        }).not.toThrow();
        expect(html).toContain("sm");
      });
    });

    it("lets set() run without a window", () => {
      withoutWindow(() => {
        let set: ((next: Size) => void) | undefined;
        function Capture() {
          const pref = usePersistedPreference("k", "sm" as Size, isSize);
          set = pref[1];
          return null;
        }
        renderToString(<Capture />);
        expect(set).toBeTypeOf("function");
        expect(() => set?.("lg")).not.toThrow();
      });
    });
  });
});

describe("useViewMode", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("offers only untimed views by default", () => {
    const { result } = renderHook(() => useViewMode("tasks"));
    expect(result.current[2]).toEqual(["list", "kanban", "table"]);
  });

  it("offers every view to a time-capable section", () => {
    const { result } = renderHook(() => useViewMode("tasks", { timeCapable: true }));
    expect(result.current[2]).toContain("calendar");
    expect(result.current[2]).toContain("timeline");
  });

  it("restores a stored view the section still offers", () => {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY("tasks"), "calendar");
    const { result } = renderHook(() => useViewMode("tasks", { timeCapable: true }));
    expect(result.current[0]).toBe("calendar");
  });

  it("falls back when the stored view is no longer offered", () => {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY("tasks"), "calendar");
    const { result } = renderHook(() => useViewMode("tasks", { timeCapable: false }));
    expect(result.current[0]).toBe("kanban");
  });

  it("rewrites the stale value so it cannot resurface later", () => {
    // Without the rewrite, a section that regains its dates would silently snap
    // back to a view the user abandoned months ago.
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY("tasks"), "calendar");
    renderHook(() => useViewMode("tasks", { timeCapable: false }));
    expect(window.localStorage.getItem(VIEW_MODE_STORAGE_KEY("tasks"))).toBe("kanban");
  });

  it("persists a chosen view", () => {
    const { result } = renderHook(() => useViewMode("tasks", { timeCapable: true }));
    act(() => result.current[1]("timeline"));
    expect(window.localStorage.getItem(VIEW_MODE_STORAGE_KEY("tasks"))).toBe("timeline");
  });

  it("keeps sections independent", () => {
    const tasks = renderHook(() => useViewMode("tasks"));
    act(() => tasks.result.current[1]("table"));
    const projects = renderHook(() => useViewMode("projects"));
    expect(projects.result.current[0]).toBe("kanban");
  });
});

describe("useDetailMode", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to overlay", () => {
    const { result } = renderHook(() => useDetailMode("task"));
    expect(result.current[0]).toBe("overlay");
  });

  it("persists per entity, independently", () => {
    const task = renderHook(() => useDetailMode("task"));
    act(() => task.result.current[1]("popup"));
    const project = renderHook(() => useDetailMode("project"));
    expect(project.result.current[0]).toBe("overlay");
    expect(window.localStorage.getItem(DETAIL_MODE_STORAGE_KEY("task"))).toBe("popup");
  });

  it("accepts a caller-supplied fallback, which is D18's recorded gap", () => {
    // Notion derives this default from the collection layout. One product is
    // not three, so it is not adopted — but passing a computed fallback is the
    // whole of the fix, and it must work.
    const { result } = renderHook(() => useDetailMode("task", "popup"));
    expect(result.current[0]).toBe("popup");
  });

  it("does not let the record axis read the collection axis's key", () => {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY("task"), "table");
    const { result } = renderHook(() => useDetailMode("task"));
    expect(result.current[0]).toBe("overlay");
  });
});
