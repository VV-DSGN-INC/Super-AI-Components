import "@testing-library/jest-dom/vitest";

// Base UI / floating-ui shims for jsdom (shadcn base-nova components use @base-ui/react)
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
window.HTMLElement.prototype.scrollIntoView ??= () => {};
window.HTMLElement.prototype.hasPointerCapture ??= () => false;
window.HTMLElement.prototype.setPointerCapture ??= () => {};
window.HTMLElement.prototype.releasePointerCapture ??= () => {};
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

/**
 * localStorage polyfill.
 *
 * Node 26 ships its own `localStorage` global that is inert unless the process
 * gets `--localstorage-file`, and it shadows the one jsdom would otherwise
 * provide — so `window.localStorage` is undefined here and every read of it
 * throws. Nothing in the registry needed storage until the `use-view-mode`
 * contract, which is why this is only appearing now.
 *
 * The implementation is installed on `Storage.prototype` rather than as a
 * plain object literal, so `vi.spyOn(Storage.prototype, "setItem")` still
 * intercepts it — the storage-denied and storage-full paths are tested that
 * way, and a literal would leave those tests silently exercising nothing.
 */
if (typeof window !== "undefined" && !window.localStorage) {
  const StorageCtor: { prototype: Storage } =
    (globalThis as { Storage?: { prototype: Storage } }).Storage ?? (class Storage {} as never);
  (globalThis as { Storage?: unknown }).Storage ??= StorageCtor;

  const backing = new Map<string, string>();
  const proto = StorageCtor.prototype as unknown as Record<string, unknown>;

  proto.getItem = (key: string) => (backing.has(String(key)) ? backing.get(String(key))! : null);
  proto.setItem = (key: string, value: string) => void backing.set(String(key), String(value));
  proto.removeItem = (key: string) => void backing.delete(String(key));
  proto.clear = () => backing.clear();
  proto.key = (index: number) => [...backing.keys()][index] ?? null;
  Object.defineProperty(proto, "length", { get: () => backing.size, configurable: true });

  Object.defineProperty(window, "localStorage", {
    value: Object.create(proto),
    configurable: true,
    writable: true,
  });
}

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
globalThis.IntersectionObserver ??= IntersectionObserverStub as unknown as typeof IntersectionObserver;
