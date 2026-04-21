# TrekYatra Process Guardrails

## Non-Negotiable Workflow
1. Read `docs/MASTER_TRACKER.md`
2. Read `docs/DEPENDENCY_MAP.md`
3. Read the active step doc in `docs/steps/`
4. Inspect current file dependencies before changing any code
5. Make only the scoped changes for the active step
6. Update tracker + dependency map + active step doc
7. Provide bash commands, full file contents, and a git commit for that step
8. Wait for user confirmation before moving to the next step

## Anti-Hallucination Rules
- Do not assume hidden files or unstated architecture.
- Treat uploaded/static frontend files as source of truth until replaced intentionally.
- Do not modify existing files without checking blast radius.
- Do not skip doc updates.
- Do not merge multiple major steps into one unless explicitly approved.

## Implementation Rules
- Use VS Code + Terminal compatible commands.
- Prefer Apple Silicon safe packages and Docker images.
- Keep backend and frontend in separate folders.
- All new code must be production-oriented, typed, and structured.
- Use full file outputs only when changing/creating files.

## Step Completion Checklist
- [ ] Scope implemented
- [ ] Local run commands provided
- [ ] Validation commands provided
- [ ] Git commit command provided
- [ ] Tracker updated
- [ ] Dependency map updated
- [ ] Step doc updated
