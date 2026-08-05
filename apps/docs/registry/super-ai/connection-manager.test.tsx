import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConnectionManager, type ConnectionProvider } from "./connection-manager";

const row = (container: HTMLElement, id: string) =>
  container.querySelector<HTMLElement>(
    `[data-slot="connection-manager-provider"][data-provider-id="${id}"]`,
  )!;

const condition = (root: HTMLElement) =>
  root.querySelector('[data-slot="connection-manager-condition"]')!.textContent ?? "";

const remedy = (root: HTMLElement) =>
  root.querySelector('[data-slot="connection-manager-remedy"]')!.textContent ?? "";

const LOCAL: ConnectionProvider = {
  id: "llama",
  name: "Llama 3.1 8B",
  status: "not-set",
  local: {
    size: "4.7 GB",
    requirements: [
      { label: "Memory", value: "16 GB RAM", met: true },
      { label: "Disk", value: "12 GB free", met: true },
    ],
  },
};

/**
 * Every attribute, every input value and the serialized markup — a secret can
 * hide in a `title`, an `aria-label` or a live input value without ever showing
 * up in `innerHTML`, and all three are exfiltration surfaces.
 */
const domCarries = (secret: string) => {
  if (document.body.innerHTML.includes(secret)) return true;
  if (Array.from(document.querySelectorAll("input")).some((el) => el.value.includes(secret))) return true;
  return Array.from(document.querySelectorAll("*")).some((el) =>
    Array.from(el.attributes).some((attr) => attr.value.includes(secret)),
  );
};

describe("ConnectionManager", () => {
  // ---------------------------------------------------------------------------
  // Declared states
  // ---------------------------------------------------------------------------

  it("renders the not-set state", () => {
    const { container } = render(
      <ConnectionManager providers={[{ id: "openai", name: "OpenAI", status: "not-set" }]} />,
    );
    const openai = row(container, "openai");

    // The condition is words, not a colour or a dot.
    expect(condition(openai)).toContain("Not connected");
    expect(remedy(openai)).toContain("write-only");

    // Nothing is stored, so there is a key field and nothing to test yet.
    expect(screen.getByLabelText("OpenAI API key")).toBeInTheDocument();
    expect(within(openai).queryByRole("button", { name: "Test connection" })).toBeNull();
  });

  it("renders the valid state", () => {
    const { container } = render(
      <ConnectionManager
        providers={[
          {
            id: "openai",
            name: "OpenAI",
            status: "valid",
            fingerprint: "sk-live ···· 4f2a",
            testedAt: "Tested 4 minutes ago",
          },
        ]}
        onTest={() => {}}
      />,
    );
    const openai = row(container, "openai");

    expect(condition(openai)).toContain("Connected");
    // A stored key shows as a masked fingerprint and a test time, never a value.
    expect(openai).toHaveTextContent("sk-live ···· 4f2a");
    expect(openai).toHaveTextContent("Tested 4 minutes ago");
    // There is no key field until the user asks to replace the key.
    expect(screen.queryByLabelText("OpenAI API key")).toBeNull();
    expect(within(openai).getByRole("button", { name: "Test connection" })).toBeInTheDocument();
  });

  it("renders the invalid state", () => {
    const { container } = render(
      <ConnectionManager
        providers={[{ id: "openai", name: "OpenAI", status: "invalid", fingerprint: "sk-live ···· 4f2a" }]}
        onTest={() => {}}
      />,
    );
    const openai = row(container, "openai");

    // The provider answered — it just refused the key. That is the user's to fix.
    expect(condition(openai)).toContain("Key rejected");
    expect(remedy(openai)).toContain("Generate a new key");
    expect(within(openai).getByRole("button", { name: "Replace key" })).toBeInTheDocument();
  });

  it("renders the unreachable state", () => {
    const { container } = render(
      <ConnectionManager
        providers={[
          { id: "openai", name: "OpenAI", status: "unreachable", fingerprint: "sk-live ···· 4f2a" },
        ]}
        onTest={() => {}}
      />,
    );
    const openai = row(container, "openai");

    // Nothing was rejected. The remedy is to wait and retry, not to rotate.
    expect(condition(openai)).toContain("Provider unreachable");
    expect(remedy(openai)).toContain("Keep the saved key");
    expect(within(openai).getByRole("button", { name: "Test connection" })).toBeInTheDocument();
  });

  it("renders the local-model state", () => {
    const { container } = render(<ConnectionManager providers={[LOCAL]} onDownload={() => {}} />);
    const llama = row(container, "llama");

    expect(llama).toHaveAttribute("data-kind", "local-model");
    expect(condition(llama)).toContain("Not installed");
    // Download size and hardware requirements are on the row before anything is fetched.
    expect(llama).toHaveTextContent("4.7 GB download");
    expect(within(llama).getByText(/Memory: 16 GB RAM/)).toBeInTheDocument();
    expect(within(llama).getByText(/Disk: 12 GB free/)).toBeInTheDocument();
    expect(within(llama).getByRole("button", { name: "Download model" })).toBeEnabled();
    // A local model has no key, so it must not offer a key field.
    expect(screen.queryByLabelText(/API key/)).toBeNull();
  });

  it("passes className through", () => {
    render(<ConnectionManager providers={[]} className="test-class" />);
    expect(document.querySelector('[data-slot="connection-manager"]')!.className).toContain("test-class");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing: invalid and unreachable are not the same failure
  // ---------------------------------------------------------------------------

  it("gives invalid and unreachable different copy, different remedies and different actions", () => {
    const { container } = render(
      <ConnectionManager
        providers={[
          { id: "openai", name: "OpenAI", status: "invalid", fingerprint: "sk ···· 4f2a" },
          { id: "anthropic", name: "Anthropic", status: "unreachable", fingerprint: "sk ···· 91bd" },
        ]}
        onTest={() => {}}
      />,
    );
    const rejected = row(container, "openai");
    const down = row(container, "anthropic");

    expect(condition(rejected)).not.toBe(condition(down));
    expect(remedy(rejected)).not.toBe(remedy(down));

    // A rejected key is the user's problem: replace it.
    expect(within(rejected).getByRole("button", { name: "Replace key" })).toBeInTheDocument();
    // A provider that is down is not: there is deliberately no way to rotate a
    // key that was never refused, because doing so is wasted work.
    expect(within(down).queryByRole("button", { name: "Replace key" })).toBeNull();
    expect(remedy(down)).toMatch(/replacing it will not help/i);
  });

  // ---------------------------------------------------------------------------
  // Load-bearing: test-connection is its own action, not a side effect of saving
  // ---------------------------------------------------------------------------

  it("does not test as a side effect of saving, and tests only when asked", async () => {
    const onSaveKey = vi.fn();
    const onTest = vi.fn();
    const provider: ConnectionProvider = { id: "openai", name: "OpenAI", status: "not-set" };
    const { container, rerender } = render(
      <ConnectionManager providers={[provider]} onSaveKey={onSaveKey} onTest={onTest} />,
    );

    await userEvent.type(screen.getByLabelText("OpenAI API key"), "sk-test-abcdef");
    await userEvent.click(screen.getByRole("button", { name: "Save key" }));

    expect(onSaveKey).toHaveBeenCalledWith("openai", "sk-test-abcdef");
    // Saving stores a credential and reports no verdict on it.
    expect(onTest).not.toHaveBeenCalled();

    // A stored key with no verdict is its own condition — not "valid" by
    // default, and not an error either. Only a test resolves it.
    rerender(
      <ConnectionManager
        providers={[{ ...provider, fingerprint: "sk ···· cdef" }]}
        onSaveKey={onSaveKey}
        onTest={onTest}
      />,
    );
    const openai = row(container, "openai");
    expect(condition(openai)).toContain("never tested");
    expect(screen.queryByLabelText("OpenAI API key")).toBeNull();

    await userEvent.click(within(openai).getByRole("button", { name: "Test connection" }));
    expect(onTest).toHaveBeenCalledWith("openai");
  });

  it("announces the test result in a live region while a test is in flight", () => {
    const { container } = render(
      <ConnectionManager
        providers={[{ id: "openai", name: "OpenAI", status: "valid", testing: true }]}
        onTest={() => {}}
      />,
    );
    const result = row(container, "openai").querySelector('[data-slot="connection-manager-result"]')!;

    expect(result).toHaveAttribute("role", "status");
    expect(result).toHaveTextContent("Testing this connection…");
    expect(within(row(container, "openai")).getByRole("button", { name: "Testing…" })).toBeDisabled();
  });

  // ---------------------------------------------------------------------------
  // Load-bearing: keys are write-only
  // ---------------------------------------------------------------------------

  it("never renders a saved key back into the DOM", async () => {
    const SECRET = "sk-live-9q7w3e1r5t8y";
    const onSaveKey = vi.fn();
    const provider: ConnectionProvider = { id: "openai", name: "OpenAI", status: "not-set" };
    const { rerender } = render(
      <ConnectionManager providers={[provider]} onSaveKey={onSaveKey} onTest={() => {}} />,
    );

    const field = screen.getByLabelText("OpenAI API key");
    // A key field is a password field with a real visible label — never a
    // placeholder-only input, and never a tooltip.
    expect(field).toHaveAttribute("type", "password");

    await userEvent.type(field, SECRET);
    await userEvent.click(screen.getByRole("button", { name: "Save key" }));

    // The key crosses the boundary exactly once, then the field is emptied.
    expect(onSaveKey).toHaveBeenCalledWith("openai", SECRET);
    expect(domCarries(SECRET)).toBe(false);

    // And it is still gone once the caller reports the key stored: what comes
    // back is a fingerprint, and there is no prop that could carry the value.
    rerender(
      <ConnectionManager
        providers={[{ ...provider, status: "valid", fingerprint: "sk-live ···· 8y" }]}
        onSaveKey={onSaveKey}
        onTest={() => {}}
      />,
    );
    expect(domCarries(SECRET)).toBe(false);
    expect(screen.getByText(/sk-live ···· 8y/)).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Load-bearing: hardware requirements come before the download
  // ---------------------------------------------------------------------------

  it("states hardware requirements before the download button", () => {
    const { container } = render(<ConnectionManager providers={[LOCAL]} onDownload={() => {}} />);
    const llama = row(container, "llama");
    const requirements = llama.querySelector('[data-slot="connection-manager-requirements"]')!;
    const download = within(llama).getByRole("button", { name: "Download model" });

    expect(requirements.compareDocumentPosition(download) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("blocks the download when the machine cannot run the model, and says so", async () => {
    const onDownload = vi.fn();
    const { container } = render(
      <ConnectionManager
        providers={[
          {
            ...LOCAL,
            local: {
              size: "4.7 GB",
              requirements: [
                { label: "Memory", value: "32 GB RAM", met: false },
                { label: "Disk", value: "12 GB free", met: true },
              ],
            },
          },
        ]}
        onDownload={onDownload}
      />,
    );
    const llama = row(container, "llama");

    // Stated in words, before the download, not discovered after it.
    expect(within(llama).getByText(/Memory: 32 GB RAM — this machine does not meet it/)).toBeInTheDocument();
    expect(llama.querySelector('[data-slot="connection-manager-blocked"]')).toHaveTextContent(
      "Download blocked",
    );

    const download = within(llama).getByRole("button", { name: "Download model" });
    expect(download).toBeDisabled();
    await userEvent.click(download);
    expect(onDownload).not.toHaveBeenCalled();
  });
});
