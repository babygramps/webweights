'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAICoachStore } from '@/lib/stores/ai-coach-store';

export function CoachProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const setContext = useAICoachStore((state) => state.setContext);

  useEffect(() => {
    // Update context based on current page
    setContext({ currentPage: pathname });
  }, [pathname, setContext]);

  return <>{children}</>;
}
