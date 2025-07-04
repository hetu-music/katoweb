import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminClientComponent from './AdminClient';
import { getSongs } from '../lib/supabase';
import type { Song } from '../lib/types';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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

  let songs: Song[] = [];
  let error = null;
  try {
    songs = await getSongs('temp', session.access_token);
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'message' in e && typeof (e as Error).message === 'string') {
      error = (e as Error).message;
      console.error('Fetch songs error:', (e as Error).message);
    } else {
      error = 'Unknown error';
      console.error('Fetch songs error:', e);
    }
  }

  return <AdminClientComponent initialSongs={songs} initialError={error} />;
}