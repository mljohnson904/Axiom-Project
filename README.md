# Axiom Project Workspace

This repository contains planning docs and project workstreams for multiple Axiom initiatives.

## Projects
- `projects/prospect-builder.md`
- `projects/client-intake.md`
- `projects/operations.md`
- `projects/ai-systems-audit.md`
- `projects/axiom-site.md`

## New Isolated App Workspace
To avoid interfering with Prospect Builder and other workstreams, the **Axiom Follow-Up Command Center** app now lives in its own isolated project folder:

- `products/follow-up-command-center/`

Run it from that folder:

```bash
cd products/follow-up-command-center
npm install
npm run dev
```

Then open `http://localhost:3000`.
