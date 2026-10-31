# Where the reasoning behind each rule lives

In the record itself. Every rule in `core.ts` carries three fields that answer
the questions a reviewer asks before relaxing it:

- `title`: what the rule bans, in one line.
- `fix`: what to write instead. The detector prints it next to each hit, so a
  violation arrives with its substitution.
- `why`: what goes wrong without the rule.

Read those before you loosen or delete a rule. When you add one, fill `why`
with the failure you saw, in your system's words.

The method the rules serve (decide once in the system, ban the named
defaults, audit with counts, fix by substitution) is the unslop skill's job,
not this folder's. Its repo copy is `../03-gates/unslop-SKILL.md`.
