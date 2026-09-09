## Spec-driven development

This project follows spec-driven development. Before implementing anything:

1. Read `.claude/spec/constitution/mission.md` and `tech-stack.md` — they define what this project is, its stack, and its hard limits. A feature that conflicts with them gets rethought, not the constitution.
2. Check `.claude/spec/constitution/roadmap.md` for what's next.
3. Work inside the relevant `.claude/spec/features/NNN-nombre-feature/` folder: read `spec.md` (what/why/acceptance criteria) and `plan.md` (how) before touching code, then track progress in `tasks.md`.
4. When a feature is done, verify it against its `spec.md` acceptance criteria and move it to "Hecho" in `roadmap.md`.
5. Starting a new feature: create `.claude/spec/features/NNN-nombre-feature/` with `spec.md` + `plan.md` + `tasks.md` before writing code. See `.claude/spec/README.md` for the full workflow.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
