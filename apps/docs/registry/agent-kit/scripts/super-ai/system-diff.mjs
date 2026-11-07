/** Rule 5 of the consumer kit, made checkable: which parts of a diff change
 *  the design system rather than build a feature with it.
 *
 *  Pure. The caller runs `git diff --unified=0` and `git ls-files --others`.
 *  node:* and relative imports only; this file ships into consumer apps with
 *  the agent-kit registry item.
 *
 *  Known false positive: a component-local custom property declared in a CSS
 *  file reports as a token change. Rule 5 asks the agent to show the human,
 *  not to stop, so an over-report costs one look. */

const TOKEN_LINE = /^[+-]\s*--[a-z0-9-]+\s*:/;

const under = (file, dir) => file === dir || file.startsWith(`${dir}/`);

/**
 * @param {{ diff: string, untracked: string[], dirs: { ui: string, kit: string } }} input
 * @returns {{ file: string, reason: "new-primitive" | "installed-edit" | "token-change" }[]}
 */
export function systemChanges({ diff, untracked, dirs }) {
  const found = new Map();
  const add = (file, reason) => found.set(`${file}\0${reason}`, { file, reason });
  const isSystemDir = (file) => under(file, dirs.ui) || under(file, dirs.kit);

  let file = null;
  let created = false;
  for (const line of diff.split("\n")) {
    if (line.startsWith("diff --git ")) {
      const m = / b\/(.+)$/.exec(line);
      file = m ? m[1] : null;
      created = false;
      continue;
    }
    if (file === null) continue;
    if (line.startsWith("new file mode")) {
      created = true;
      continue;
    }
    if (line.startsWith("+++ ") || line.startsWith("--- ")) {
      if (line.startsWith("+++ ") && isSystemDir(file)) add(file, created ? "new-primitive" : "installed-edit");
      continue;
    }
    if (file.endsWith(".css") && TOKEN_LINE.test(line)) add(file, "token-change");
  }

  for (const path of untracked) {
    if (isSystemDir(path)) add(path, "new-primitive");
  }

  return [...found.values()].sort((a, b) => a.file.localeCompare(b.file) || a.reason.localeCompare(b.reason));
}
