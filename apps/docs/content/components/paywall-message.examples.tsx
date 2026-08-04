"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CostProvider } from "@/registry/super-ai/cost";
import { PaywallMessage } from "@/registry/super-ai/paywall-message";

/**
 * Live examples for paywall-message.docs.tsx.
 *
 * Client sidecar, kept separate from the docs module on purpose: the docs
 * module is plain data read by a Server Component, so it cannot carry
 * "use client" and cannot hold JSX with event handlers. Every example here is
 * zero-prop, so an `onUpgrade` never has to cross the server/client boundary.
 */

const PROMPT = "A slow dolly across a rain-lit Tokyo alley at night, neon reflections in the puddles";

export function ResumeCarriesThePrompt() {
  return (
    <CostProvider balance={120} onTopUp={() => {}}>
      <PaywallMessage
        state="locked-model"
        requirement="Pro"
        prompt={PROMPT}
        model="Veo 3.1"
        cost={{ amount: 900, per: "min" }}
        before="I have the shot ready, but Veo 3.1 is not on your plan — I stopped before spending anything."
        after="Your prompt and model are held here, so upgrading picks this straight back up."
        onUpgrade={() => {}}
      />
    </CostProvider>
  );
}

export function PreviewLabelledNotJustGreyed() {
  return (
    <PaywallMessage
      state="feature-locked"
      requirement="Studio"
      prompt="Give the narrator my cloned voice and lip-sync it to the presenter shot"
      model="ElevenLabs v3"
      preview="A 40-second voice track, lip-synced to the presenter take."
      before="Voice cloning is a Studio feature, so I stopped at the script."
      after="Everything else in this edit is finished — only this step is waiting."
      onUpgrade={() => {}}
    />
  );
}

/**
 * The anti-pattern, hand-rolled: a card with no prose around it and nothing of
 * the user's work on it. Deliberately not built from PaywallMessage, because
 * PaywallMessage cannot be made to look like this.
 */
export function BareUpgradeCard() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles aria-hidden className="size-4" />
          Unlock Pro
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-foreground/70 text-sm">
          Get faster models, higher resolution, and priority rendering.
        </p>
        <Button size="sm" className="self-start">
          See plans
        </Button>
      </CardContent>
    </Card>
  );
}

/** The other anti-pattern: the gate is explained, but the work is gone. */
export function PromptDiscarded() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <p className="text-sm leading-relaxed">
        That model is not on your plan, so I could not run it.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Upgrade to continue</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-foreground/70 text-sm">
            Once you are on Pro, enter your prompt again and pick the model.
          </p>
          <Button size="sm" className="self-start">
            Upgrade
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
