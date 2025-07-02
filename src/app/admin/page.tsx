import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../lib/supabase-server';
import AdminPageClient from './AdminPageClient';

export default async function AdminPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/admin/login');
  }
  return <AdminPageClient />;
}