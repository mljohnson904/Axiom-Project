# GitHub Setup

## Current Setup

`mljohnson904/Axiom-Project` is the Axiom hub repo.

Use it for:

- Project briefs
- Product planning
- Operating notes
- Task tracking through GitHub Issues
- Mapping future standalone repositories

## Recommended Structure

Start small in the hub repo. Split into separate repos when a project has its own codebase, release flow, or deployment process.

Future repo names:

- `axiom-prospect-builder`
- `axiom-site`
- `axiom-client-intake`
- `axiom-ai-systems-audit`
- `axiom-operations`

## Issue Workflow

Use GitHub Issues as the active board.

Suggested issue types:

- `Build:` implementation work
- `Plan:` planning or decisions
- `Ops:` operating process
- `Content:` copywriting and offer work
- `Bug:` defects or regressions

## Splitting a Project Later

When a project moves to its own repo:

1. Create the new repository in GitHub.
2. Move or copy the project files into that repo.
3. Keep the summary file in `projects/` updated.
4. Add the standalone repo link to the hub README.
5. Move active issues or recreate the important ones in the new repo.
