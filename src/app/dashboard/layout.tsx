import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NavShell } from '@/components/layout/nav-shell';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return <NavShell user={user}>{children}</NavShell>;
}
