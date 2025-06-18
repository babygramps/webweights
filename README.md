# Weightlifting App 💪

A modern, mobile-first web application for weightlifters to design mesocycles, log workouts, and track progress. Built with **Next.js 15**, **React 19**, **TypeScript**, **Supabase**, and **Tailwind CSS**.

## 🚀 Features

- **Mesocycle Builder**: Design custom training programs with periodization
- **Exercise Catalogue**: Comprehensive exercise database with filtering
- **In-Gym Logger**: Mobile-optimized interface with rest timer and configurable notifications
- **Progress Tracking**: Visualize 1RM estimates, volume load, and personal records
- **Data Export**: Download your complete workout history as a CSV file
- **AI Assistant**: Get help building mesocycles with AI (coming soon)

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Database**: Supabase (PostgreSQL 16), Drizzle ORM
- **State Management**: Zustand, TanStack Query
- **Testing**: Vitest, Playwright
- **Charts**: Recharts v3
- **Tools**: ESLint, Prettier, Husky

## 📋 Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase account
- Git

## 🏗️ Setup

1. **Clone the repository**

   ```bash
   git clone [your-repo-url]
   cd weightlifting-app
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` with your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   DATABASE_URL=your_database_connection_string
   ```

4. **Set up the database**

   ```bash
   # Generate migrations
   pnpm db:generate

   # Push schema to database
   pnpm db:push
   ```

5. **Start the development server**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## 📚 Project Structure

```
weightlifting-app/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── db/              # Database schema and queries
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and configs
│   ├── store/           # Zustand stores
│   └── test/            # Test utilities
├── supabase/
│   ├── migrations/      # Database migrations
│   └── functions/       # Edge functions
├── e2e/                 # Playwright tests
└── public/              # Static assets
```

## 🧪 Development

### Available Scripts

```bash
# Development
pnpm dev          # Start dev server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server

# Testing
pnpm test         # Run unit tests
pnpm test:ui      # Run tests with UI
pnpm e2e          # Run E2E tests
pnpm e2e:ui       # Run E2E tests with UI

# Code Quality
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
pnpm format:check # Check formatting

# Database
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema to database
pnpm db:studio    # Open Drizzle Studio
```

### Testing

- **Unit Tests**: Located in `src/**/__tests__`
- **E2E Tests**: Located in `e2e/`
- Run tests before committing (automated with Husky)

### Code Style

- ESLint and Prettier are configured
- Pre-commit hooks run automatically
- Follow the existing patterns in the codebase

## 🗺️ Roadmap

### Phase 1: Foundation ✅

- [x] Project setup and tooling
- [x] Database schema
- [x] Development environment

### Phase 2: Core Features (In Progress)

- [ ] Authentication flow
- [ ] Exercise catalogue
- [ ] Mesocycle builder
- [ ] Workout logger

### Phase 3: Analytics

- [ ] Progress charts
- [ ] 1RM calculator
- [ ] Volume tracking

### Phase 4: Advanced

- [ ] AI mesocycle assistant
- [ ] Social features
- [ ] PWA support

### Phase 5: Stats Dashboard & Analytics ✅

- [x] Stats Dashboard Page (`/stats`)
  - Recent workouts list with volume metrics
  - Personal records (PRs) display cards
  - Volume and intensity trends over time
  - Muscle group distribution charts
  - Workout completion/adherence rates
- [x] Chart Components (using Recharts)
  - Reusable `ProgressChart` for line/bar charts
  - `MuscleGroupChart` for pie/donut visualizations
  - `PRCard` for displaying personal records
  - `StatsCard` for key metrics
- [x] Database Queries
  - Efficient aggregation queries for stats
  - Personal records calculation
  - Volume and muscle group analytics
  - Workout completion tracking
- [x] Robust Logging
  - Comprehensive logging throughout stats queries
  - Error handling with detailed logs

### Phase 6: Polishing & UX Enhancements (Next)

- [ ] Mobile polish: Test all flows on mobile, improve touch targets
- [ ] Accessibility: Keyboard navigation, ARIA labels, color contrast
- [ ] Performance: Optimize queries, lazy-load components
- [ ] Notifications: Toasts for PRs, workout completion

### Phase 7: Social & Sharing (Future)

- [ ] Share progress: Export charts/images
- [ ] Friends/leaderboards: Compare stats
- [ ] Templates: Save/share mesocycles

## 📄 Database Schema

The app uses the following main tables:

- **mesocycles**: Training programs
- **workouts**: Individual workout sessions
- **exercises**: Exercise catalogue
- **workout_exercises**: Exercise prescriptions
- **sets_logged**: Actual performed sets

See `src/db/schema.ts` for the complete schema.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
