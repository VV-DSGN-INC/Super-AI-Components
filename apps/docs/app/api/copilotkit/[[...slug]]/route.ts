import { CopilotRuntime, createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";

import { ScriptedRunsAgent } from "@/components/copilotkit-spike/scripted-agent";

// SPIKE. The /copilotkit demo's runtime: one scripted agent, served over AG-UI.
// No model is configured, so this route cannot spend anything.
const runtime = new CopilotRuntime({ agents: { default: new ScriptedRunsAgent() } });

const handler = createCopilotRuntimeHandler({ runtime, basePath: "/api/copilotkit" });

export { handler as DELETE, handler as GET, handler as PATCH, handler as POST };
