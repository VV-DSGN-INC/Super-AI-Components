"use client";

import { SafetyBlock } from "@/registry/super-ai/safety-block";

/**
 * Live examples for safety-block.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence` and friends directly, so safety-block.docs.tsx has to stay
 * plain server-evaluable data and cannot carry "use client" itself. The
 * examples below cross into it as zero-prop elements.
 *
 * `sensitive` drives internal reveal state inside SafetyBlock, so these have
 * to render on the client to be usable rather than merely visible.
 */

export function VariantMatchesTheEvent() {
  // The right way: the same policy, two events, two headlines. The reader can
  // tell whether their request left the building.
  return (
    <div className="flex flex-col gap-3">
      <SafetyBlock
        variant="input-blocked"
        policy="Personal data policy"
        alternatives="Remove the customer's name and address, then send it again."
      />
      <SafetyBlock
        variant="output-blocked"
        policy="Personal data policy"
        alternatives="Ask for the summary without the account holder's details."
      />
    </div>
  );
}

export function BlockWithAWayForward() {
  // The right way: a named policy, the span that tripped it, and a concrete
  // next move. The user can act without guessing what the rule was.
  return (
    <SafetyBlock
      variant="input-blocked"
      policy="Medical advice policy"
      fragment="…what dose of amitriptyline should I take for my back?"
      alternatives="Ask for general information about the medication, or contact a pharmacist for a dose."
    />
  );
}

export function RefusalInTheAssistantsVoice() {
  // The wrong way: the copy is written as the model apologising for itself.
  // "I'm sorry" is a voice, and it is the assistant's — which is exactly the
  // reading this component exists to prevent. The policy field is not a place
  // to write a sentence, either: it is meant to name a rule the user could go
  // and look up.
  return (
    <SafetyBlock
      variant="output-blocked"
      policy="I'm sorry, I can't help with that"
      alternatives="I'd rather not go into this. Maybe try asking me something else?"
    />
  );
}

export function FragmentQuotedInTheClear() {
  // The wrong way: the quote is the harm, and it is sitting on screen
  // unblurred for anyone walking past. Either omit `fragment` entirely or set
  // `sensitive` so seeing it is a deliberate act — never leave the decision to
  // whoever happens to be looking at the monitor.
  return (
    <div className="flex flex-col gap-3">
      <SafetyBlock
        variant="input-blocked"
        policy="Credential-sharing policy"
        fragment="…deploy with the key sk-live-4f9c2ab7e10d and restart the worker."
        alternatives="Reference the secret by name instead of pasting its value."
      />
      <SafetyBlock
        variant="input-blocked"
        policy="Credential-sharing policy"
        sensitive
        fragment="…deploy with the key sk-live-4f9c2ab7e10d and restart the worker."
        alternatives="Reference the secret by name instead of pasting its value."
      />
    </div>
  );
}
