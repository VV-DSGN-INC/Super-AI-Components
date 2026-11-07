import { createChatHandler } from "@/components/generated-chat/server/chat-handler";
import { modelFromEnv } from "@/components/generated-chat/server/model-from-env";
import { createRateLimiter } from "@/components/generated-chat/server/rate-limit";

// The /generated-chat demo's model path. Off unless GENERATED_CHAT_MODEL names
// a gateway model; the gateway authenticates with the deployment's OIDC token.
export const maxDuration = 30;

const limiter = createRateLimiter({ limit: 20, windowMs: 10 * 60 * 1000 });

export const POST = createChatHandler({ model: modelFromEnv(process.env.GENERATED_CHAT_MODEL), limiter });
