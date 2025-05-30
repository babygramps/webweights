'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  useUserPreferences,
  Theme,
} from '@/lib/contexts/UserPreferencesContext';

export function ThemeToggle() {
  const { theme, updateTheme, loading } = useUserPreferences();

  const handleToggle = async () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';

    try {
      await updateTheme(newTheme);
      toast.success(`Theme changed to ${newTheme}`);
    } catch (error) {
      toast.error('Failed to update theme');
      console.error('Error updating theme:', error);
    }
  };

  const icon =
    theme === 'dark' ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    );

  if (loading) {
    return (
      <Button variant="outline" size="icon" disabled>
        {icon}
      </Button>
    );
  }

  return (
    <Button variant="outline" size="icon" onClick={handleToggle}>
      {icon}
    </Button>
  );
}
