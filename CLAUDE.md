@AGENTS.md

## Architecture doc maintenance

`ARCHITECTURE.md` in this repo's root documents the tech stack, libraries, routes, and how the admin capabilities actually work, plus a "Project Details" section on how this app connects to `paw-stives-backend` and `paw-stives-frontend`.

**After completing any task in this repo, check whether it changed anything ARCHITECTURE.md describes** — a new route, a new dependency, a changed flow, a closed gap — and update the file if so. Don't wait to be asked.

Do not document the current UI component library/primitives in ARCHITECTURE.md — it's being replaced with plain HTML + Tailwind, so keep that file focused on data flow, routes, and business logic, not the current component system.
