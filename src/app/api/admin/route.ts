import { NextRequest, NextResponse } from 'next/server';
import { getSongs, createSong, updateSong } from '../../lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { verifyCSRFToken } from '@/app/lib/utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

//类型校验
const SongSchema = z.object({
  title: z.string().min(1).max(100),
  album: z.string().max(100).nullable().optional(),
  genre: z.array(z.string().max(30)).nullable().optional(),
  lyricist: z.array(z.string().max(30)).nullable().optional(),
  composer: z.array(z.string().max(30)).nullable().optional(),
  artist: z.array(z.string().max(30)).nullable().optional(),
  length: z.number().int().min(1).nullable().optional(),
  hascover: z.boolean().nullable().optional(),
  date: z.string().max(30).nullable().optional(),
  type: z.array(z.string().max(30)).nullable().optional(),
  albumartist: z.array(z.string().max(30)).nullable().optional(),
  arranger: z.array(z.string().max(30)).nullable().optional(),
  comment: z.string().max(10000).nullable().optional(),
  discnumber: z.number().int().min(1).nullable().optional(),
  disctotal: z.number().int().min(1).nullable().optional(),
  lyrics: z.string().max(10000).nullable().optional(),
  track: z.number().int().min(1).nullable().optional(),
  tracktotal: z.number().int().min(1).nullable().optional(),
  kugolink: z.string().url().max(200).nullable().optional(),
  qmlink: z.string().url().max(200).nullable().optional(),
  nelink: z.string().url().max(200).nullable().optional(),
});

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
    // 严格校验 Bearer token 格式
    const match = authHeader.match(/^Bearer ([A-Za-z0-9\-\._~\+\/]+=*)$/);
    if (match) {
      token = match[1];
    } else {
      // 格式不对直接拒绝
      return null;
    }
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyCSRFToken(request))) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    // 校验 body
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
    console.error('POST song error:', e.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await verifyCSRFToken(request))) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id || typeof id !== 'number' || id < 1 || !Number.isInteger(id)) return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 });
    // 校验 data
    const parseResult = SongSchema.safeParse(data);
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
    const song = await updateSong(id, parseResult.data, 'temp', session?.access_token);
    return NextResponse.json(song);
  } catch (e: any) {
    console.error('PUT song error:', e.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}