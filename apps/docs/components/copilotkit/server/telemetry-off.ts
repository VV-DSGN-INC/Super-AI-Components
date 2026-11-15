/**
 * Switches CopilotKit's runtime telemetry off for this process.
 *
 * CopilotKit sends telemetry from the server, not the browser, and reads these
 * two variables each time it decides whether to send. Import this first in any
 * route that loads `@copilotkit/runtime`, so it holds wherever the docs site
 * runs, a Vercel deploy included, not only where a local env file exists.
 * `DO_NOT_TRACK` is the cross-tool convention, so an explicit setting of it is
 * left alone; CopilotKit's own switch is always forced off.
 */
process.env.COPILOTKIT_TELEMETRY_DISABLED = "true";
process.env.DO_NOT_TRACK ??= "1";

export {};
