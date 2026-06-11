import { AiNode } from "@/registry/super-ai/flow/ai-node";

function MediaPlaceholder() {
  return <div className="aspect-video w-full rounded-md bg-muted" />;
}

export default function AiNodeDemo() {
  return (
    <div className="grid grid-cols-1 justify-items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <AiNode id="demo-idle" title="Prompt" modelLabel="GPT-5 mini" runtime="cloud" status="idle" size="sm">
        <p className="text-xs">A neon city street at night, light rain, cinematic.</p>
      </AiNode>
      <AiNode id="demo-queued" title="Image" modelLabel="Flux 1.1" runtime="cloud" status="queued" size="sm">
        <MediaPlaceholder />
      </AiNode>
      <AiNode
        id="demo-streaming"
        title="Video"
        modelLabel="LTX 2.3"
        runtime="local"
        status="streaming"
        size="sm"
        media={<MediaPlaceholder />}
      >
        <p className="text-xs text-muted-foreground">Rendering frames…</p>
      </AiNode>
      <AiNode
        id="demo-done"
        title="Audio"
        modelLabel="MusicGen"
        runtime="local"
        status="done"
        size="sm"
        selected
        footer={<span className="text-[11px] text-muted-foreground">12s · 44.1kHz</span>}
      >
        <MediaPlaceholder />
      </AiNode>
      <AiNode
        id="demo-failed"
        title="Upscale"
        modelLabel="ESRGAN"
        runtime="cloud"
        status="failed"
        size="sm"
        error="Provider rate limit exceeded — retry in 30 seconds."
      >
        <MediaPlaceholder />
      </AiNode>
      <AiNode
        id="demo-locked"
        title="Lipsync"
        modelLabel="Wav2Lip Pro"
        runtime="cloud"
        status="locked"
        size="sm"
        lockedCta={<span className="text-xs">Available on the Pro plan.</span>}
      />
    </div>
  );
}
