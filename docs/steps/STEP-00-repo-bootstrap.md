# STEP 00 — repo-bootstrap

## Goal
Bootstrap the monorepo, preserve the uploaded static frontend as source-of-truth, and create governance docs that prevent dependency-blind changes.

## Scope
- Create repo skeleton
- Preserve uploaded static frontend untouched in `apps/web-static`
- Create tracker/process/dependency/implementation docs
- Create step docs for future execution

## Preconditions
- Read docs/MASTER_TRACKER.md
- Read docs/PROCESS_GUARDRAILS.md
- Read docs/DEPENDENCY_MAP.md

## Dependency Check
- Uploaded frontend zip is unpacked without modification
- No existing code has been changed
- Future changes to `apps/web-static` require dependency review first

## Files Created
- README.md
- docs/MASTER_TRACKER.md
- docs/PROCESS_GUARDRAILS.md
- docs/DEPENDENCY_MAP.md
- docs/IMPLEMENTATION_PLAN.md
- docs/steps/*

## Files Modified
- None beyond created bootstrap files

## Validation Commands
- `find . -maxdepth 3 | sort`
- `ls apps/web-static/src/pages`

## Status
Ready for user validation

## Notes
- Wait for user confirmation before Step 01.
