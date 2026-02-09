---
name: coding-convention
description: Refactor code according to the project's CODING_CONVENTION.md without changing behavior.
---

## Instruction

When this skill is used, you must follow **CODING_CONVENTION.md in the project root** as the single source of truth.

## Rules

- Do not change behavior, output, or side effects.
- Refactor only structure, naming, ordering, and declarations.
- If there is any conflict:
  1. CODING_CONVENTION.md
  2. ./claude/CLAUDE.md
  3. General TypeScript / React best practices

## Scope

- Apply changes only to code explicitly requested or recently modified.
