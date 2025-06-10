import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { UserPreferencesProvider } from '@/lib/contexts/UserPreferencesContext';
import { ThemeProvider } from 'next-themes';
import { CoachProvider } from '@/components/ai-coach/CoachProvider';
import { CoachButton } from '@/components/ai-coach/CoachButton';

// Google Fonts are disabled in CI due to network restrictions.
// Use system fonts instead to ensure builds succeed offline.

export const metadata: Metadata = {
  title: 'WeightTracker - Modern Weightlifting Companion',
  description: 'Design mesocycles, log workouts, and track your progress',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <ThemeProvider attribute="class" defaultTheme="light">
          <UserPreferencesProvider>
            <CoachProvider>
              {children}
              <CoachButton />
            </CoachProvider>
          </UserPreferencesProvider>
        </ThemeProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
