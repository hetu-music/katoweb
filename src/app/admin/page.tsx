import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminClientComponent from './AdminClient';
import { getSongs } from '../lib/supabase';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error('Session error:', sessionError?.message || 'No session found');
    redirect('/admin/login');
  }

  let songs: any[] = [];
  let error = null;
  try {
    songs = await getSongs('temp', session.access_token);
  } catch (e: any) {
    error = e.message;
    console.error('Fetch songs error:', e.message);
  }

  return <AdminClientComponent initialSongs={songs} initialError={error} />;
}