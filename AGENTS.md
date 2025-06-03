# AGENT.md

This file is read by **all OpenAI-powered agents, contributors, CI jobs, and human developers** working in this repository. It defines mandatory coding standards, workflows, and the _runtime checklist_ an agent must satisfy **before returning code**. Deviation from any **MUST** rule is treated as an error.

---

## 1 Code Style & Formatting (**MUST**)

### 1.1 Tooling

- **ESLint** + **Prettier** – configs live at `.eslintrc.*` and `.prettierrc`.
- Run `pnpm lint --max-warnings 0` **and** `pnpm format`

  ```bash
  # Run unit/integration tests only when they exist
  if [ -d tests ] && [ "$(ls -A tests 2>/dev/null)" ]; then pnpm test:ci; fi
  ```

  _(skip if the `tests/` directory is empty)._

- **E2E:** Playwright – `pnpm e2e`.
- Mock all external API calls and DB access in tests.

---

## 2 AWS Amplify Deployment (**MUST**)

This project deploys to **AWS Amplify**. All code changes **MUST** pass Amplify's build process.

### 2.1 TypeScript Requirements

- **Zero TypeScript errors** – Amplify fails builds on any TS error.
- All imports **MUST** resolve correctly with proper paths.
- Export all types that are imported elsewhere.
- Use absolute imports (`@/...`) consistently for better reliability.

### 2.2 Build Validation

Before any code submission, **MUST** verify the production build works:

```bash
# Clear any cached build artifacts
rm -rf .next

# Test production build (same as Amplify)
pnpm run build
```

If `pnpm run build` fails locally, it **WILL** fail on Amplify.

### 2.3 Common Amplify Issues to Avoid

- **Missing type exports** – export interfaces/types that are imported across files
- **Circular dependencies** – avoid importing from files that import back
- **Case-sensitive paths** – Amplify's Linux environment is case-sensitive
- **Node.js compatibility** – ensure all dependencies work in Amplify's Node environment

---

## 3 Workflows

### 3.1 Branch & Commit

- Branch names: `feature/<slug>` or `fix/<slug>`.
- Messages: Conventional Commits (`feat: …`, `fix: …`, `chore: …`).

### 3.2 Pre-commit (Husky + lint-staged)

Husky triggers **lint-staged** which _auto-fixes_ and blocks on remaining errors.

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

### 3.3 Continuous Integration

- `pnpm install --frozen-lockfile`
- `pnpm lint && pnpm test:ci && pnpm e2e`

### 3.4 Testing Requirements (**MUST**)

- All new features and bug fixes **MUST** include corresponding unit tests.
- If a test is not included, a clear justification **MUST** be added to the PR description.
- Tests must fully mock external API calls and database interactions.

---

## 4 Architecture & Libraries

- **State:** Zustand; server data: TanStack Query.
- **UI:** shadcn/ui + Tailwind CSS; charts via Recharts.
- **Data layer:** Supabase + Drizzle ORM (migrations in `supabase/migrations/`).
- **Error handling:** user-friendly messages + console logging; optional Supabase telemetry.
- **Security:** never commit secrets.

---

## 5 Agent Runtime Checklist (**ABSOLUTE MUST**)

An OpenAI agent **MUST** execute the following steps _before_ returning its final answer:

1. **Generate** the code / patch.

2. **Run** the commands below inside a virtual shell:

   ```bash
   pnpm install --ignore-scripts --frozen-lockfile
   pnpm lint --fix --max-warnings 0
   pnpm format
   pnpm test:ci
   ```

   > **Note:** Do not use `pnpm test` without flags — it runs in watch mode and may cancel or hang. Use `pnpm test:ci` instead, or run `pnpm test --run`.

   > To simplify this, add the following script to `package.json`:
   >
   > ```json
   > "scripts": {
   >   "test:ci": "vitest run"
   > }
   > ```

3. **AWS AMPLIFY VALIDATION** (**CRITICAL**) - Run production build test:

   ```bash
   # Clear build artifacts and test production build
   rm -rf .next
   pnpm run build
   ```

   This **MUST** succeed with zero errors. If it fails, the deployment will fail.

4. **TypeScript strict validation**:

   ```bash
   pnpm exec tsc --noEmit --strict
   ```

   Zero TypeScript errors allowed.

5. **If any command exits non-zero**, iteratively amend the code _until_ all commands succeed (max 3 internal iterations).

6. Return the final diff or files _only after all checks pass_. If still failing after 3 iterations, reply with an error report **instead of broken code**.

---

## 6 Common Commands (reference)

| Task             | Command                  |
| ---------------- | ------------------------ |
| Dev server       | `pnpm dev`               |
| Lint             | `pnpm lint`              |
| Format           | `pnpm format`            |
| Unit tests       | `pnpm test:ci`           |
| E2E tests        | `pnpm e2e`               |
| Production build | `pnpm run build`         |
| TypeScript check | `pnpm exec tsc --noEmit` |
| DB migration     | `pnpm db:migrate`        |

---

## 7 Deployment Troubleshooting

If Amplify deployment fails:

1. **Check the build logs** for TypeScript/ESLint errors
2. **Run `pnpm run build` locally** – must succeed
3. **Verify all imports/exports** are correctly defined
4. **Check for case-sensitive file path issues**
5. **Ensure all dependencies are in `package.json`**

---

## 8 Updating this file

- Keep it concise and current.
- Update when ESLint/Prettier configs, workflows, or conventions change.
- Commit updates alongside related code changes when feasible.

---

### References

- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Recharts Docs](https://recharts.org/en-US/guide)
- [AWS Amplify Docs](https://docs.aws.amazon.com/amplify/)

---

**Follow every MUST in this document. Passing lint, format, tests, type-check AND production build _before_ committing is non-negotiable.**
