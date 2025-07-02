import { NextRequest, NextResponse } from 'next/server';
import { getSongs, createSong, updateSong } from '../../lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { validateCsrf } from '../../lib/csrf';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getUserFromRequest(request: NextRequest) {
  // 只允许 Bearer token，且格式严格
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !/^Bearer [A-Za-z0-9\-\._~\+\/]+=*$/i.test(authHeader)) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  if (!token) return null;

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

  // 用 getUser(token) 校验
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

const SongSchema = z.object({
  title: z.string().min(1).max(100),
  album: z.string().optional(),
  lyricist: z.array(z.string()).optional(),
  composer: z.array(z.string()).optional(),
  hascover: z.boolean().optional(),
  date: z.string().optional(),
  // 其他字段按需添加
});

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
  // CSRF 校验
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: 'CSRF token invalid' }, { status: 403 });
  }
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parseResult = SongSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: parseResult.error.errors }, { status: 400 });
    }
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
    const song = await createSong(parseResult.data, 'temp', session?.access_token);
    return NextResponse.json(song);
  } catch (e: any) {
    console.error('POST song error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // CSRF 校验
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ error: 'CSRF token invalid' }, { status: 403 });
  }
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    if (!('id' in body) || typeof body.id !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 });
    }
    const parseResult = SongSchema.safeParse({ ...body, id: undefined });
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: parseResult.error.errors }, { status: 400 });
    }
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
    const song = await updateSong(body.id, parseResult.data, 'temp', session?.access_token);
    return NextResponse.json(song);
  } catch (e: any) {
    console.error('PUT song error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}