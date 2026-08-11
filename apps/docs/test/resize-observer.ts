/* A controllable ResizeObserver for jsdom.

   vitest.setup.ts installs a PASSIVE stub so components that merely construct
   a ResizeObserver do not crash. That stub can never fire, so a test that needs
   to drive a width installs this one over it and removes it afterwards.

   jsdom ships no ResizeObserver and reports every element as 0x0, so a test
   cannot resize anything by touching the DOM. This records the live observers
   and lets a test push a width straight into their callbacks. */

type Entry = { contentRect: { width: number } };
type Callback = (entries: Entry[]) => void;

const active = new Set<{ callback: Callback }>();

class ControllableResizeObserver {
  private token: { callback: Callback };

  constructor(callback: Callback) {
    this.token = { callback };
  }

  observe(): void {
    active.add(this.token);
  }

  unobserve(): void {
    active.delete(this.token);
  }

  disconnect(): void {
    active.delete(this.token);
  }
}

export function installResizeObserver(): void {
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    writable: true,
    value: ControllableResizeObserver,
  });
}

/** Remove it entirely, to assert the no-ResizeObserver fallback. */
export function uninstallResizeObserver(): void {
  Reflect.deleteProperty(globalThis as object, "ResizeObserver");
}

/** Push a width to every live observer. Wrap calls in `act()`. */
export function resizeTo(width: number): void {
  for (const { callback } of active) callback([{ contentRect: { width } }]);
}

export function clearResizeObservers(): void {
  active.clear();
}
