import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ChannelMessage,
  type Channel,
  type ChannelMessageData,
  type ChannelMessageState,
} from "./channel-message";
import { expectAccessibleName } from "@/lib/test-utils";

const ASK: ChannelMessageData = {
  kind: "ask",
  from: "Dr O'Body",
  what: "Your blood pressure reading is due.",
  ask: "How did it go today?",
  options: ["Fine", "Not great", "Skip today"],
  link: "lifeos://vitals/7",
  expires: "Fri 18:00",
  quiet: "Stop asking",
};

const READY: ChannelMessageData = {
  kind: "ready",
  from: "Lifey",
  what: "Your Weekly Review is ready.",
  link: "lifeos://review/42",
  quiet: "Stop asking",
};

const slot = (name: string) => document.querySelector(`[data-slot="channel-message-${name}"]`);
const root = () => document.querySelector('[data-slot="channel-message"]') as HTMLElement;

describe("ChannelMessage states", () => {
  // The state is a word, never a colour alone: one assertion per declared state.
  const WORDS: Record<ChannelMessageState, string> = {
    pending: "Pending",
    sent: "Sent",
    answered: "Answered",
    withdrawn: "Withdrawn",
    expired: "Expired",
    "failed-check": "Failed check",
    "not-routed": "Not routed",
  };

  for (const [state, word] of Object.entries(WORDS) as [ChannelMessageState, string][]) {
    it(`renders the ${state} state as the word "${word}"`, () => {
      render(<ChannelMessage channel="chat" message={ASK} state={state} />);
      expect(slot("state")!.textContent).toBe(word);
      expect(root().dataset.state).toBe(state);
    });
  }

  it("answered replaces the controls with the result", () => {
    const onAnswer = vi.fn();
    render(
      <ChannelMessage channel="chat" message={ASK} state="answered" answer="Fine" onAnswer={onAnswer} />,
    );
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(slot("options")).toBeNull();
    expect(slot("answer")!.textContent).toContain("Fine");
  });

  it("answered moves focus to the result when the state arrives", () => {
    const { rerender } = render(
      <ChannelMessage channel="chat" message={ASK} state="sent" onAnswer={() => {}} />,
    );
    rerender(
      <ChannelMessage channel="chat" message={ASK} state="answered" answer="Fine" onAnswer={() => {}} />,
    );
    expect(document.activeElement).toBe(slot("answer"));
  });

  it("answered on first render does not steal focus", () => {
    render(<ChannelMessage channel="chat" message={ASK} state="answered" answer="Fine" />);
    expect(document.activeElement).toBe(document.body);
  });

  it("a failed check can be answered: the template of the same kind went out", () => {
    const onAnswer = vi.fn();
    render(
      <ChannelMessage
        channel="chat"
        message={ASK}
        state="failed-check"
        path="fallback"
        onAnswer={onAnswer}
      />,
    );
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual([
      "Fine",
      "Not great",
      "Skip today",
    ]);
  });

  it("only a sent or failed-check message can be answered", () => {
    for (const state of ["pending", "withdrawn", "expired"] as const) {
      const { unmount } = render(
        <ChannelMessage channel="chat" message={ASK} state={state} onAnswer={() => {}} />,
      );
      expect(screen.queryAllByRole("button"), state).toHaveLength(0);
      unmount();
    }
  });

  it("not-routed without a reason still names the state and renders no empty region", () => {
    // Review Focus 3.
    render(<ChannelMessage channel="push" message={ASK} state="not-routed" />);
    expect(slot("state")!.textContent).toBe("Not routed");
    expect(slot("reason")).toBeNull();
    for (const el of root().querySelectorAll("*")) {
      if (el.children.length === 0) expect(el.textContent!.trim().length, el.outerHTML).toBeGreaterThan(0);
    }
  });

  it("not-routed shows the reason in words and does not draw the message", () => {
    render(
      <ChannelMessage channel="push" message={ASK} state="not-routed" reason="push was answered first" />,
    );
    expect(slot("reason")!.textContent).toBe("push was answered first");
    expect(screen.queryByText(ASK.what)).toBeNull();
  });

  it("shows the reason and the path when they are given", () => {
    render(
      <ChannelMessage
        channel="chat"
        message={ASK}
        state="failed-check"
        path="fallback"
        reason="no-guilt failed"
      />,
    );
    expect(slot("reason")!.textContent).toBe("no-guilt failed");
    expect(slot("path")!.textContent).toBe("Fallback template");
  });
});

describe("ChannelMessage controls", () => {
  it("push caps the actions at three and says how many more are in the app", () => {
    // Review Focus 1.
    const six = ["One", "Two", "Three", "Four", "Five", "Six"];
    render(
      <ChannelMessage
        channel="push"
        locked={false}
        message={{ ...ASK, options: six }}
        state="sent"
        onAnswer={() => {}}
      />,
    );
    const buttons = within(slot("options") as HTMLElement).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual(["One", "Two", "Three"]);
    expect(slot("overflow")!.textContent).toBe("and 3 more in the app");
  });

  it("the app thread names its overflow the same way", () => {
    const six = ["One", "Two", "Three", "Four", "Five", "Six"];
    render(
      <ChannelMessage channel="app" message={{ ...ASK, options: six }} state="sent" onAnswer={() => {}} />,
    );
    expect(within(slot("options") as HTMLElement).getAllByRole("button")).toHaveLength(5);
    expect(slot("overflow")!.textContent).toBe("and 1 more in the app");
  });

  it("the phone script counts its overflow the same way", () => {
    const six = ["One", "Two", "Three", "Four", "Five", "Six"];
    render(<ChannelMessage channel="phone" message={{ ...ASK, options: six }} state="sent" />);
    expect(slot("overflow")!.textContent).toBe("and 1 more in the app");
  });

  it("caps chat at five, email at one", () => {
    const six = ["One", "Two", "Three", "Four", "Five", "Six"];
    const { unmount } = render(
      <ChannelMessage channel="chat" message={{ ...ASK, options: six }} state="sent" onAnswer={() => {}} />,
    );
    expect(within(slot("options") as HTMLElement).getAllByRole("button")).toHaveLength(5);
    expect(slot("overflow")!.textContent).toBe("and 1 more in the app");
    unmount();
    render(
      <ChannelMessage channel="email" message={{ ...ASK, options: six }} state="sent" onAnswer={() => {}} />,
    );
    expect(within(slot("options") as HTMLElement).getAllByRole("button")).toHaveLength(1);
    expect(slot("overflow")!.textContent).toBe("and 5 more in the app");
  });

  it("does not print an overflow line when everything fits", () => {
    render(<ChannelMessage channel="chat" message={ASK} state="sent" onAnswer={() => {}} />);
    expect(slot("overflow")).toBeNull();
  });

  it("without onAnswer the controls are inert text, never a dead button", () => {
    // Review Focus 2.
    for (const channel of ["app", "push", "chat", "email", "phone", "sms"] as Channel[]) {
      const { unmount } = render(
        <ChannelMessage channel={channel} locked={false} message={ASK} state="sent" />,
      );
      expect(screen.queryAllByRole("button"), channel).toHaveLength(0);
      expect(slot("options"), channel).not.toBeNull();
      unmount();
    }
  });

  it("an option button is named by its own text and reports its value", async () => {
    const onAnswer = vi.fn();
    render(<ChannelMessage channel="chat" message={ASK} state="sent" onAnswer={onAnswer} />);
    const button = screen.getByRole("button", { name: "Not great" });
    expectAccessibleName(button, "Not great");
    await userEvent.click(button);
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith("Not great");
  });

  it("the phone script reads the options aloud and takes a keypad answer", async () => {
    const onAnswer = vi.fn();
    render(<ChannelMessage channel="phone" message={ASK} state="sent" onAnswer={onAnswer} />);
    expect(slot("script")!.textContent).toContain("Press 2 for Not great");
    await userEvent.click(screen.getByRole("button", { name: "Press 2 for Not great" }));
    expect(onAnswer).toHaveBeenCalledWith("Not great");
  });
});

describe("ChannelMessage email, answered and path", () => {
  it("an email with no options has no button: the link is text, never a control", () => {
    render(<ChannelMessage channel="email" message={READY} state="sent" onAnswer={() => {}} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(slot("options")).toBeNull();
    expect(slot("link")!.textContent).toBe("Open in the app");
    expect(slot("link")!.getAttribute("data-link")).toBe("lifeos://review/42");
  });

  it("an email with options has one button and keeps the link as text", () => {
    render(<ChannelMessage channel="email" message={ASK} state="sent" onAnswer={() => {}} />);
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["Fine"]);
    expect(slot("link")!.textContent).toBe("Open in the app");
  });

  it("answered replaces the controls on every channel", () => {
    for (const channel of ["app", "push", "chat", "email", "phone", "sms"] as Channel[]) {
      const { unmount } = render(
        <ChannelMessage
          channel={channel}
          locked={false}
          message={ASK}
          state="answered"
          answer="Fine"
          onAnswer={() => {}}
        />,
      );
      expect(screen.queryAllByRole("button"), channel).toHaveLength(0);
      expect(slot("answer")!.textContent, channel).toBe("Answered: Fine");
      unmount();
    }
  });

  it("answered with no answer value still says so", () => {
    render(<ChannelMessage channel="chat" message={ASK} state="answered" />);
    expect(slot("answer")!.textContent).toBe("Answered");
  });

  it("names each path in words", () => {
    for (const [path, word] of [
      ["code", "Written by code"],
      ["live", "Written live"],
      ["fallback", "Fallback template"],
    ] as const) {
      const { unmount } = render(<ChannelMessage channel="chat" message={READY} state="sent" path={path} />);
      expect(slot("path")!.textContent).toBe(word);
      unmount();
    }
  });

  it("prints the deadline as given", () => {
    render(<ChannelMessage channel="app" message={ASK} state="sent" />);
    expect(root().textContent).toContain("Expires Fri 18:00");
  });

  it("leaves focus alone when the caller, not the person, sets answered", () => {
    const { rerender } = render(
      <>
        <button type="button">Step</button>
        <ChannelMessage channel="chat" message={ASK} state="sent" onAnswer={() => {}} />
      </>,
    );
    screen.getByRole("button", { name: "Step" }).focus();
    rerender(
      <>
        <button type="button">Step</button>
        <ChannelMessage channel="chat" message={ASK} state="answered" answer="Fine" onAnswer={() => {}} />
      </>,
    );
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Step" }));
  });

  it("moves focus to the result when the pressed button was on the message", () => {
    const { rerender } = render(
      <ChannelMessage channel="chat" message={ASK} state="sent" onAnswer={() => {}} />,
    );
    screen.getByRole("button", { name: "Fine" }).focus();
    rerender(
      <ChannelMessage channel="chat" message={ASK} state="answered" answer="Fine" onAnswer={() => {}} />,
    );
    expect(document.activeElement).toBe(slot("answer"));
  });
});

describe("ChannelMessage lock screen", () => {
  it("a locked push shows who and what kind, and never what", () => {
    // Review Focus 5.
    render(<ChannelMessage channel="push" message={ASK} state="sent" onAnswer={() => {}} />);
    expect(slot("from")!.textContent).toBe("Dr O'Body");
    expect(slot("kind")!.textContent).toBe("has a check-in");
    expect(root().textContent).not.toContain(ASK.what);
    expect(root().textContent).not.toContain(ASK.ask!);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("names each kind in the lock screen's words", () => {
    const phrase: Record<ChannelMessageData["kind"], string> = {
      ask: "has a check-in",
      due: "has something due",
      ready: "has something ready",
      receipt: "saved something",
      notice: "has a notice",
    };
    for (const [kind, text] of Object.entries(phrase) as [ChannelMessageData["kind"], string][]) {
      const { unmount } = render(<ChannelMessage channel="push" message={{ ...READY, kind }} state="sent" />);
      expect(slot("kind")!.textContent).toBe(text);
      unmount();
    }
  });

  it("unlocking shows the body and the actions", () => {
    render(<ChannelMessage channel="push" locked={false} message={ASK} state="sent" onAnswer={() => {}} />);
    expect(screen.getByText(ASK.what)).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });
});

describe("ChannelMessage content", () => {
  it("a second recipient gets the summary and none of the detail", () => {
    const message = {
      ...ASK,
      summary: "Her case needs one document.",
      handoff: "A care manager calls Monday.",
    };
    render(<ChannelMessage channel="chat" to="second" message={message} state="sent" onAnswer={() => {}} />);
    expect(screen.getByText("Her case needs one document.")).toBeInTheDocument();
    expect(screen.queryByText(ASK.what)).toBeNull();
    expect(slot("ask")).toBeNull();
    expect(slot("options")).toBeNull();
    expect(slot("handoff")).toBeNull();
  });

  it("a second recipient without a summary gets the kind phrase, not the detail", () => {
    render(<ChannelMessage channel="app" to="second" message={ASK} state="sent" />);
    expect(root().textContent).toContain("Dr O'Body has a check-in");
    expect(root().textContent).not.toContain(ASK.what);
  });

  it("shows the handoff line and the trust line when they are given", () => {
    render(
      <ChannelMessage
        channel="email"
        message={{ ...ASK, handoff: "A pharmacist calls Monday." }}
        trust="We never ask for codes by text."
        state="sent"
      />,
    );
    expect(slot("handoff")!.textContent).toBe("A pharmacist calls Monday.");
    expect(slot("trust")!.textContent).toBe("We never ask for codes by text.");
  });

  it("carries the quiet slot on every channel", () => {
    for (const channel of ["app", "push", "chat", "email", "phone", "sms"] as Channel[]) {
      const { unmount } = render(
        <ChannelMessage channel={channel} locked={false} message={READY} state="sent" />,
      );
      expect(slot("quiet")!.textContent, channel).toContain("Stop asking");
      unmount();
    }
  });

  it("keeps the full text of the message in every channel", () => {
    for (const channel of ["app", "chat", "email", "phone", "sms"] as Channel[]) {
      const { unmount } = render(<ChannelMessage channel={channel} message={ASK} state="sent" />);
      expect(root().textContent, channel).toContain(ASK.what);
      expect(root().textContent, channel).toContain(ASK.ask!);
      unmount();
    }
  });

  it("slow pace on the phone says the key fact twice, and nowhere else", () => {
    const say = (pace: "default" | "slow", channel: Channel) => {
      const { unmount } = render(
        <ChannelMessage channel={channel} pace={pace} message={READY} state="sent" />,
      );
      const count = root().textContent!.split(READY.what).length - 1;
      unmount();
      return count;
    };
    expect(say("default", "phone")).toBe(1);
    expect(say("slow", "phone")).toBe(2);
    expect(say("slow", "chat")).toBe(1);
    expect(say("slow", "sms")).toBe(1);
  });

  it("the phone script opens with the trust line", () => {
    render(<ChannelMessage channel="phone" trust="We never ask for codes." message={READY} state="sent" />);
    // The first paragraph is the "Phone script" caption; the spoken lines follow it.
    const [, first, second] = slot("script")!.querySelectorAll("p");
    expect(first!.textContent).toBe("This is Lifey.");
    expect(second!.textContent).toBe("We never ask for codes.");
  });

  it("large type switches the type scale", () => {
    const { rerender } = render(<ChannelMessage channel="chat" message={READY} state="sent" />);
    expect(slot("what")!.className).toContain("text-sm");
    rerender(<ChannelMessage channel="chat" typeSize="large" message={READY} state="sent" />);
    expect(slot("what")!.className).toContain("text-lg");
    expect(slot("what")!.className).not.toContain("text-sm");
  });

  it("large type keeps the taller floor on the option buttons", () => {
    render(<ChannelMessage channel="chat" typeSize="large" message={ASK} state="sent" onAnswer={() => {}} />);
    for (const button of screen.getAllByRole("button")) {
      expect(button.className).toContain("min-h-9");
      expect(button.className).toContain("text-base");
    }
  });

  it("names the article by its sender and channel", () => {
    render(<ChannelMessage channel="email" message={READY} state="sent" />);
    expect(screen.getByRole("article", { name: "Email message from Lifey" })).toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<ChannelMessage className="test-class" channel="chat" message={READY} state="sent" />);
    expect(root().className).toContain("test-class");
  });
});

describe("ChannelMessage sms", () => {
  it("opens the text with the sender's name, inside the text", () => {
    render(<ChannelMessage channel="sms" message={ASK} state="sent" />);
    const text = slot("what")!.parentElement!.textContent!;
    expect(text.startsWith("Dr O'Body: Your blood pressure reading is due.")).toBe(true);
    expect(slot("from")!.textContent).toBe("Dr O'Body");
  });

  it("puts the ask after the body", () => {
    render(<ChannelMessage channel="sms" message={ASK} state="sent" />);
    const text = root().textContent!;
    expect(text.indexOf(ASK.what)).toBeLessThan(text.indexOf(ASK.ask!));
  });

  it("numbers the options as replies, and they are buttons when sent and answerable", async () => {
    const onAnswer = vi.fn();
    render(<ChannelMessage channel="sms" message={ASK} state="sent" onAnswer={onAnswer} />);
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual([
      "Reply 1 Fine",
      "Reply 2 Not great",
      "Reply 3 Skip today",
    ]);
    const second = screen.getByRole("button", { name: "Reply 2 Not great" });
    expectAccessibleName(second, "Reply 2 Not great");
    await userEvent.click(second);
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith("Not great");
  });

  it("a failed check can be answered on sms, like the other channels", () => {
    render(
      <ChannelMessage channel="sms" message={ASK} state="failed-check" path="fallback" onAnswer={() => {}} />,
    );
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("shows the numbered replies as inert text without onAnswer, and when not answerable", () => {
    const { unmount } = render(<ChannelMessage channel="sms" message={ASK} state="sent" />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(slot("options")!.textContent).toContain("Reply 1 Fine");
    unmount();
    render(<ChannelMessage channel="sms" message={ASK} state="withdrawn" onAnswer={() => {}} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("answered replaces the numbered replies with the result", () => {
    render(<ChannelMessage channel="sms" message={ASK} state="answered" answer="Fine" onAnswer={() => {}} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(slot("options")).toBeNull();
    expect(slot("answer")!.textContent).toBe("Answered: Fine");
  });

  it("carries one link, the opt-out line, the trust line and the deadline", () => {
    render(<ChannelMessage channel="sms" message={ASK} trust="We never ask for codes." state="sent" />);
    expect(root().querySelectorAll('[data-slot="channel-message-link"]')).toHaveLength(1);
    expect(slot("link")!.textContent).toBe("Open in the app");
    expect(slot("quiet")!.textContent).toBe("Reply STOP: Stop asking");
    expect(slot("trust")!.textContent).toBe("We never ask for codes.");
    expect(root().textContent).toContain("Expires Fri 18:00");
  });

  it("caps the numbered replies at five and counts the rest", () => {
    const six = ["One", "Two", "Three", "Four", "Five", "Six"];
    render(
      <ChannelMessage channel="sms" message={{ ...ASK, options: six }} state="sent" onAnswer={() => {}} />,
    );
    expect(within(slot("options") as HTMLElement).getAllByRole("button")).toHaveLength(5);
    expect(slot("overflow")!.textContent).toBe("and 1 more in the app");
  });

  it("not-routed names sms in words and draws no text", () => {
    render(<ChannelMessage channel="sms" message={ASK} state="not-routed" reason="no consent for SMS" />);
    expect(slot("state")!.textContent).toBe("Not routed");
    expect(slot("reason")!.textContent).toBe("no consent for SMS");
    expect(root().textContent).toContain("Nothing was sent on SMS.");
    expect(screen.queryByText(ASK.what)).toBeNull();
  });

  it("a second recipient gets the summary after the sender's name", () => {
    render(
      <ChannelMessage
        channel="sms"
        to="second"
        message={{ ...ASK, summary: "Her case needs one document." }}
        state="sent"
        onAnswer={() => {}}
      />,
    );
    expect(slot("what")!.parentElement!.textContent).toBe("Dr O'Body: Her case needs one document.");
    expect(slot("options")).toBeNull();
  });

  it("is named by channel and sender, and is the same article shape", () => {
    render(<ChannelMessage channel="sms" message={READY} state="sent" />);
    expect(screen.getByRole("article", { name: "SMS message from Lifey" })).toBeInTheDocument();
    expect(root().dataset.channel).toBe("sms");
  });

  it("large type switches the scale on sms", () => {
    render(<ChannelMessage channel="sms" typeSize="large" message={ASK} state="sent" onAnswer={() => {}} />);
    expect(slot("what")!.className).toContain("text-lg");
    for (const button of screen.getAllByRole("button")) expect(button.className).toContain("min-h-9");
  });
});
