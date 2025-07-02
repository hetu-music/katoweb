import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminClientComponent from './AdminClient';

console.log('supabaseUrl:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('supabaseAnonKey:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function fetchSongs(accessToken?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3001';
  console.log('Fetching from:', `${baseUrl}/api/admin`);
  const res = await fetch(`${baseUrl}/api/admin`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Fetch error:', errorText);
    throw new Error('获取歌曲失败');
  }
  return res.json();
}

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

  let songs = [];
  let error = null;
  try {
    songs = await fetchSongs(session.access_token);
  } catch (e: any) {
    error = e.message;
    console.error('Fetch songs error:', e.message);
  }

  return <AdminClientComponent initialSongs={songs} initialError={error} />;
}