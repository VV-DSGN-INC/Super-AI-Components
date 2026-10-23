/**
 * The kill switch. `GENERATED_CHAT_MODEL` holds a gateway `provider/model` ID;
 * unset, blank or `off` means no model, and the chat stays scripted. Nothing
 * else turns the model on, so a deploy without the variable is scripted.
 */
export function modelFromEnv(value: string | undefined): string | null {
  const id = value?.trim() ?? "";
  if (id === "" || id.toLowerCase() === "off") return null;
  return /^[a-z0-9-]+\/[\w.-]+$/i.test(id) ? id : null;
}
