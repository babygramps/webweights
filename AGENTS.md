# AGENTS.md

## Code Style & Formatting

- **TypeScript/JavaScript:**

  - Use ESLint and Prettier (config in repo).
  - Run `pnpm lint` and `pnpm format` before committing.
  - Prefer explicit types; avoid `any`.
  - Use functional components and hooks for React.
  - Use shadcn/ui and Tailwind CSS for UI.

- **Naming Conventions:**

  - Components: `PascalCase` (e.g., `WorkoutLogger.tsx`)
  - Functions/variables: `camelCase`
  - Database tables: `snake_case`
  - Constants: `UPPER_SNAKE_CASE`
  - Pages/routes: `kebab-case` (e.g., `/stats`)

- **File Structure:**
  - Page components: `src/app/`
  - Reusable UI: `src/components/ui/`
  - Feature modules: `src/components/{feature}/`
  - Database logic: `src/db/`, `src/lib/supabase/`
  - Types: `types/`

---

## Testing

- **Unit & Integration:**

  - Use Jest and React Testing Library.
  - Place tests in `src/test/` or alongside components as `*.test.ts(x)`.
  - Mock external API calls and DB access.
  - Run `pnpm test` before pushing.

- **E2E:**
  - Use Playwright (see `e2e/`).
  - Run `pnpm e2e` for end-to-end tests.

---

## Workflows

- **Development:**

  - Use feature branches: `feature/{short-description}`
  - Commit messages: Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)
  - Run `pnpm install`, `pnpm lint`, `pnpm test` before PRs.
  - Use Husky pre-commit hooks (auto-run on commit).

- **Database:**

  - Use Drizzle ORM for schema and queries.
  - Migrations in `supabase/migrations/`.
  - Run `pnpm db:migrate` after pulling new migrations.

- **Logging & Error Handling:**
  - Use robust logging in all async/data-fetching code.
  - Always provide user-friendly error states in UI.
  - Log errors to the console and (optionally) to Supabase.

---

## Architecture

- **State Management:**

  - Use Zustand for global state.
  - Use TanStack Query for server data.

- **API/Data:**

  - Use Supabase for auth and data.
  - Use Drizzle ORM for all DB access.
  - Never expose secrets in the client.

- **UI/UX:**
  - Use shadcn/ui and Tailwind for all new UI.
  - Ensure mobile responsiveness and accessibility (ARIA, keyboard nav).
  - Use Recharts for all charts/analytics.

---

## Feature-Specific Instructions

- **Stats Dashboard (`/stats`):**

  - Use reusable chart components (`ProgressChart`, `PRCard`).
  - Aggregate data efficiently in the backend.
  - Provide filter bars for date, exercise, muscle group.
  - Always show loading and error states with logging.

- **Mesocycle Builder:**
  - Use multi-step wizards.
  - Validate all user input.
  - Save progress in local state and DB.

---

## Commands

- **Start Dev Server:**  
  `pnpm dev`
- **Lint:**  
  `pnpm lint`
- **Format:**  
  `pnpm format`
- **Test:**  
  `pnpm test`
- **E2E:**  
  `pnpm e2e`
- **DB Migrate:**  
  `pnpm db:migrate`

---

## Best Practices

- **Keep it concise:** Only document rules that matter.
- **Update this file:** When workflows or standards change.
- **Version-controlled:** Always commit changes to `AGENTS.md`.

---

## References

- [Project Roadmap Best Practices (Rocketlane)](https://www.rocketlane.com/blogs/project-roadmap)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Recharts Docs](https://recharts.org/en-US/guide)

---

**This file is for OpenAI Codex agents, contributors, and maintainers. Adhere to these rules for all code, PRs, and AI-generated output.**
