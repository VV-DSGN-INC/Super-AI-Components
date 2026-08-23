---
appliesTo: [tokens-only, component-library, app-consumer]
claims: [99.1]
---

Not a real stage. `__throwing__` does not match the runner's `\d\d-` discovery
pattern, so it is only reachable by passing `stageDirs` explicitly. Its probe
throws, proving a crashing probe becomes exit 2 rather than a silent pass. The
frontmatter is present and well-formed so that the exit-2 reason under test is
the throw itself, not a malformed acceptance file.
