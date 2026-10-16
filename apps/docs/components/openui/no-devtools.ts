/** react-lang's web entry auto-mounts the OpenUI Inspect widget in development
 *  (a floating button and a deploy popover fetched from a CDN) unless this flag
 *  is already set when the module evaluates. Imported first, before react-lang,
 *  in every module here that imports it. */
(globalThis as Record<symbol, unknown>)[Symbol.for("openui.devtools.autoMount")] = true;
export {};
