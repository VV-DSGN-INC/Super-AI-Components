"use client";

import { useEffect, useRef, useState } from "react";

import { TransportControls } from "@/registry/super-ai/transport-controls";

const DURATION = 90;
const FPS = 24;

// Local state stands in for whatever the consumer actually drives — a <video>
// element, a WebAudio clock, an edit-decision list. The component renders the
// playhead it is given and reports intent back; it never owns the player.
export default function TransportControlsDemo() {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(12);
  const [speed, setSpeed] = useState(1);
  const [inPoint, setInPoint] = useState<number | null>(null);
  const [outPoint, setOutPoint] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setCurrentTime((time) => {
        const next = time + 0.25 * speed;
        if (next >= DURATION) {
          setPlaying(false);
          return DURATION;
        }
        return next;
      });
    }, 250);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, speed]);

  const clamp = (seconds: number) => Math.min(DURATION, Math.max(0, seconds));

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Simple — play, skip, speed, elapsed/total</p>
        <TransportControls
          playing={playing}
          currentTime={currentTime}
          duration={DURATION}
          speed={speed}
          onPlayPause={setPlaying}
          onSeek={(seconds) => setCurrentTime(clamp(seconds))}
          onSpeedChange={setSpeed}
        />
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">
          Frame-accurate — same buttons, same order, plus frame step and in/out
        </p>
        <TransportControls
          variant="frame-accurate"
          playing={playing}
          currentTime={currentTime}
          duration={DURATION}
          fps={FPS}
          speed={speed}
          inPoint={inPoint}
          outPoint={outPoint}
          onPlayPause={setPlaying}
          onSeek={(seconds) => setCurrentTime(clamp(seconds))}
          onStepFrame={(frames) => setCurrentTime((time) => clamp(time + frames / FPS))}
          onSpeedChange={setSpeed}
          onMarkIn={setInPoint}
          onMarkOut={setOutPoint}
        />
      </div>

      <p className="text-muted-foreground text-xs">
        Focus the bar and try the shortcuts: Space plays, arrows skip, comma and period step a frame, I and O mark in
        and out. Type a timecode into the elapsed field to seek.
      </p>
    </div>
  );
}
