# AGENT.md

This file is read by **all OpenAI‑powered agents, contributors, CI jobs, and human developers** working in this repository. It defines mandatory coding standards, workflows, and the _runtime checklist_ an agent must satisfy **before returning code**. Deviation from any **MUST** rule is treated as an error.

---

## 1  Code Style & Formatting (**MUST**)

### 1.1  Tooling

- **ESLint** + **Prettier** – configs live at `.eslintrc.*` and `.prettierrc`.
- Run `pnpm lint --max-warnings 0` **and** \`pnpm format

  # Run unit/integration tests only when they exist

  if \[ -d tests ] && \[ "\$(ls -A tests 2>/dev/null)" ]; then pnpm test; fi`*(skip if the`tests/\` directory is empty).\*

- **E2E:** Playwright – `pnpm e2e`.
- Mock all external API calls and DB access in tests.

---

## 3  Workflows

### 3.1  Branch & Commit

- Branch names: `feature/<slug>` or `fix/<slug>`.
- Messages: Conventional Commits (`feat: …`, `fix: …`, `chore: …`).

### 3.2  Pre‑commit (Husky + lint‑staged)

Husky triggers **lint‑staged** which _auto‑fixes_ and blocks on remaining errors.

`.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

`package.json`

```json
"lint-staged": {
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix --max-warnings 0",
    "prettier --write"
  ]
}
```

### 3.3  Continuous Integration

- `pnpm install --frozen-lockfile`
- `pnpm lint && pnpm test && pnpm e2e`

---

## 4  Architecture & Libraries

- **State:** Zustand; server data: TanStack Query.
- **UI:** shadcn/ui + Tailwind CSS; charts via Recharts.
- **Data layer:** Supabase + Drizzle ORM (migrations in `supabase/migrations/`).
- **Error handling:** user‑friendly messages + console logging; optional Supabase telemetry.
- **Security:** never commit secrets.

---

## 5  Agent Runtime Checklist (**ABSOLUTE MUST**)

An OpenAI agent **MUST** execute the following steps _before_ returning its final answer:

1. **Generate** the code / patch.
2. **Run** the commands below inside a virtual shell:

   ```bash
   pnpm install --ignore-scripts --frozen-lockfile
   pnpm lint --fix --max-warnings 0
   pnpm format
   pnpm test
   ```

3. **If any command exits non‑zero**, iteratively amend the code _until_ all commands succeed (max 3 internal iterations).
4. Return the final diff or files _only after all checks pass_. If still failing after 3 iterations, reply with an error report **instead of broken code**.

---

## 6  Common Commands (reference)

| Task         | Command           |
| ------------ | ----------------- |
| Dev server   | `pnpm dev`        |
| Lint         | `pnpm lint`       |
| Format       | `pnpm format`     |
| Unit tests   | `pnpm test`       |
| E2E tests    | `pnpm e2e`        |
| DB migration | `pnpm db:migrate` |

---

## 7  Updating this file

- Keep it concise and current.
- Update when ESLint/Prettier configs, workflows, or conventions change.
- Commit updates alongside related code changes when feasible.

---

### References

- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Recharts Docs](https://recharts.org/en-US/guide)

---

**Follow every MUST in this document. Passing lint, format, tests, and type‑check _before_ committing is non‑negotiable.**
