import { NextRequest, NextResponse } from 'next/server';
import { getSongs, createSong, updateSong } from '../../lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getUserFromRequest(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
  });

  // 优先用 Authorization header
  const authHeader = request.headers.get('authorization');
  let token: string | undefined;
  if (authHeader) {
    token = authHeader.replace('Bearer ', '');
  } else {
    // 没有 header 时，取 session 里的 access_token
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token;
  }

  if (!token) return null;

  // 用 getUser(token) 校验
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
    });
    const { data: { session } } = await supabase.auth.getSession();
    const songs = await getSongs('temp', session?.access_token);
    return NextResponse.json(songs);
  } catch (e: any) {
    console.error('GET songs error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
    });
    const { data: { session } } = await supabase.auth.getSession();
    const song = await createSong(body, 'temp', session?.access_token);
    return NextResponse.json(song);
  } catch (e: any) {
    console.error('POST song error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
    });
    const { data: { session } } = await supabase.auth.getSession();
    const song = await updateSong(id, data, 'temp', session?.access_token);
    return NextResponse.json(song);
  } catch (e: any) {
    console.error('PUT song error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}