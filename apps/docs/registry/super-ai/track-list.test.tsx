import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TrackList, type Track } from "./track-list";

const TRACKS: Track[] = [
  {
    id: "1",
    title: "Midnight Drive",
    artist: "Nova Kane",
    artwork: <img alt="" src="/art/midnight.png" />,
    tags: ["synthwave", "instrumental"],
    peaks: [0.2, 0.6, 0.9, 0.4, 0.7, 0.5],
    bpm: 124,
    musicalKey: "F minor",
  },
  {
    id: "2",
    title: "Paper Lanterns",
    artist: "Ilya Sound",
    artwork: <img alt="" src="/art/lanterns.png" />,
    tags: ["ambient"],
    peaks: [0.1, 0.3, 0.5, 0.2],
    bpm: 92,
    musicalKey: "C major",
  },
  // A spoken clip: no cover art, no tags, no tempo, no key. Every one of those
  // is a legitimate absence, not missing data.
  { id: "3", title: "Voice memo 04", peaks: [0.4, 0.5, 0.3] },
];

const rowFor = (name: string) => screen.getByRole("row", { name: new RegExp(name) });

const cellIn = (name: string, slot: string) =>
  rowFor(name).querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;

const barsIn = (name: string) =>
  Array.from(rowFor(name).querySelectorAll('[data-slot="track-list-waveform-bar"]'));

describe("TrackList", () => {
  it("renders the artwork state", () => {
    render(<TrackList tracks={TRACKS} />);
    // The caller's own node lands in the artwork cell...
    expect(cellIn("Midnight Drive", "track-list-artwork").querySelector("img")).toHaveAttribute(
      "src",
      "/art/midnight.png",
    );
    // ...decorative, so cover art never double-announces the title beside it.
    expect(cellIn("Paper Lanterns", "track-list-artwork").querySelector("img")).toHaveAttribute("alt", "");
    // A track with no cover art still occupies the column, deliberately.
    expect(within(cellIn("Voice memo 04", "track-list-artwork")).getByText("Not set")).toBeInTheDocument();
  });

  it("renders the tags state", () => {
    render(<TrackList tracks={TRACKS} />);
    const tags = cellIn("Midnight Drive", "track-list-tags");
    expect(within(tags).getByText("synthwave")).toBeInTheDocument();
    expect(within(tags).getByText("instrumental")).toBeInTheDocument();
    expect(within(cellIn("Paper Lanterns", "track-list-tags")).getByText("ambient")).toBeInTheDocument();
    // An empty tag list reads as "none", not as an empty cell.
    expect(within(cellIn("Voice memo 04", "track-list-tags")).getByText("Not set")).toBeInTheDocument();
  });

  it("renders the inline-waveform state", () => {
    render(<TrackList tracks={TRACKS} onPlayToggle={() => {}} />);
    // Every row gets a strip, one bar per supplied peak.
    expect(barsIn("Midnight Drive")).toHaveLength(6);
    expect(barsIn("Paper Lanterns")).toHaveLength(4);
    // The strip is decoration; the named play control carries the meaning.
    const strip = rowFor("Midnight Drive").querySelector('[data-slot="track-list-waveform"]');
    expect(strip).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("button", { name: "Play Midnight Drive" })).toBeInTheDocument();
  });

  it("renders the bpm state", () => {
    render(<TrackList tracks={TRACKS} />);
    expect(screen.getByRole("columnheader", { name: "BPM" })).toBeInTheDocument();
    expect(cellIn("Midnight Drive", "track-list-bpm")).toHaveTextContent("124");
    expect(cellIn("Paper Lanterns", "track-list-bpm")).toHaveTextContent("92");
    // A track with no tempo says so; it does not claim 0.
    expect(within(cellIn("Voice memo 04", "track-list-bpm")).getByText("Not set")).toBeInTheDocument();
  });

  it("renders the musical-key state", () => {
    render(<TrackList tracks={TRACKS} />);
    expect(screen.getByRole("columnheader", { name: "Key" })).toBeInTheDocument();
    expect(cellIn("Midnight Drive", "track-list-key")).toHaveTextContent("F minor");
    expect(cellIn("Paper Lanterns", "track-list-key")).toHaveTextContent("C major");
    expect(within(cellIn("Voice memo 04", "track-list-key")).getByText("Not set")).toBeInTheDocument();
  });

  it("renders the sparse-metadata state", () => {
    render(<TrackList tracks={[TRACKS[2]]} />);
    const row = rowFor("Voice memo 04");
    // Artwork, tags, BPM and key are each independently optional, and all four
    // absences are stated rather than blank.
    expect(within(row).getAllByText("Not set")).toHaveLength(4);
    // Never a zero, and never an empty cell.
    expect(within(row).queryByText("0")).not.toBeInTheDocument();
    for (const slot of ["track-list-tags", "track-list-bpm", "track-list-key"]) {
      expect(cellIn("Voice memo 04", slot).textContent).not.toBe("");
    }
  });

  it("passes className through", () => {
    render(<TrackList tracks={[]} className="test-class" />);
    expect(document.querySelector('[data-slot="track-list"]')!.className).toContain("test-class");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing — the spec's four bullets, pinned.
  // ---------------------------------------------------------------------------

  it("auditions in place: playing a row never navigates away from the list", async () => {
    const onPlayToggle = vi.fn();
    const onSelect = vi.fn();
    render(<TrackList tracks={TRACKS} onPlayToggle={onPlayToggle} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Play Paper Lanterns" }));

    expect(onPlayToggle).toHaveBeenCalledWith("2", true);
    // Auditioning is not opening. Comparing three takes must not cost three
    // round trips.
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getAllByRole("row")).toHaveLength(TRACKS.length + 1);
    expect(document.querySelector("a")).toBeNull();
  });

  it("owns no audio element — playback state is the caller's", () => {
    render(<TrackList tracks={TRACKS} playingId="1" progress={40} onPlayToggle={() => {}} />);
    expect(document.querySelector("audio")).toBeNull();
    // The component reflects what it is told is sounding, and asks for the
    // opposite when pressed.
    expect(rowFor("Midnight Drive")).toHaveAttribute("data-state", "playing");
    expect(rowFor("Paper Lanterns")).toHaveAttribute("data-state", "idle");
  });

  it("names every play control after its track, and flips to pause while sounding", async () => {
    const onPlayToggle = vi.fn();
    render(<TrackList tracks={TRACKS} playingId="1" onPlayToggle={onPlayToggle} />);

    // Not the third bare "Play" on the page.
    expect(screen.getByRole("button", { name: "Pause Midnight Drive" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play Paper Lanterns" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play Voice memo 04" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Pause Midnight Drive" }));
    expect(onPlayToggle).toHaveBeenCalledWith("1", false);
  });

  it("fills the waveform only on the row that is sounding", () => {
    render(<TrackList tracks={TRACKS} playingId="1" progress={50} onPlayToggle={() => {}} />);
    const played = barsIn("Midnight Drive").filter((b) => b.className.includes("bg-primary"));
    expect(played).toHaveLength(3);
    // A progress number belongs to one track, not to the list.
    expect(barsIn("Paper Lanterns").some((b) => b.className.includes("bg-primary"))).toBe(false);
  });

  it("puts no interactive inside another, and never makes the row itself a control", () => {
    render(<TrackList tracks={TRACKS} onPlayToggle={() => {}} onSelect={() => {}} />);
    for (const button of screen.getAllByRole("button")) {
      expect(button.querySelector("button")).toBeNull();
    }
    for (const row of screen.getAllByRole("row")) {
      expect(row.tagName).toBe("TR");
    }
    // Opening a track is a sibling control on the title, not the row.
    expect(screen.getByRole("button", { name: "Midnight Drive" })).toBeInTheDocument();
  });

  it("routes opening a track to its own id", async () => {
    const onSelect = vi.fn();
    render(<TrackList tracks={TRACKS} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: "Paper Lanterns" }));
    expect(onSelect).toHaveBeenCalledWith("2");
  });

  it("hides the em-dash from assistive tech so an absence is announced in words", () => {
    render(<TrackList tracks={[TRACKS[2]]} />);
    for (const dash of screen.getAllByText("—")) {
      expect(dash).toHaveAttribute("aria-hidden", "true");
    }
    // "Not set" reaches the row's accessible name; the dash does not.
    const name = rowFor("Voice memo 04").textContent ?? "";
    expect(name).toContain("Not set");
  });

  it("is a table with comparable columns, and aligns the numeric one right", () => {
    render(<TrackList tracks={TRACKS} label="Library" />);
    // Not a card grid: the numbers you came to compare stay in columns.
    expect(screen.getByRole("table", { name: "Library" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(6);
    expect(cellIn("Midnight Drive", "track-list-bpm").className).toContain("text-right");
    expect(cellIn("Midnight Drive", "track-list-bpm").className).toContain("tabular-nums");
  });

  it("renders no control at all when its handler is absent", () => {
    render(<TrackList tracks={TRACKS} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    // The strip survives — a list you cannot audition is still a list.
    expect(barsIn("Midnight Drive")).toHaveLength(6);
  });

  it("falls back to a flat strip for a track that has not been analysed", () => {
    render(<TrackList tracks={[{ id: "9", title: "Untitled stem" }]} />);
    const strip = rowFor("Untitled stem").querySelector('[data-slot="track-list-waveform"]');
    expect(strip).toHaveAttribute("data-peaks", "none");
    expect(strip).toHaveAttribute("aria-hidden", "true");
  });
});
