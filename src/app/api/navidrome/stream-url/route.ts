import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase-auth";
import { getServiceClient, TABLES } from "@/lib/supabase-server";
const nodeCrypto = require("crypto") as typeof import("crypto");

function md5(input: string): string {
  return nodeCrypto.createHash("md5").update(input, "utf8").digest("hex");
}

/**
 * GET /api/navidrome/stream-url?songId=<本站歌曲ID>
 *
 * 1. 从 navid_song 表查出对应的 navid_id
 * 2. 从当前用户的凭据构造 Subsonic stream URL
 * 3. 返回 { url } 给前端直接播放
 */
export const GET = withAuth(
  async (request: NextRequest, user: AuthenticatedUser) => {
    const { searchParams } = new URL(request.url);
    const songIdStr = searchParams.get("songId")?.trim();

    if (!songIdStr) {
      return NextResponse.json(
        { error: "songId is required" },
        { status: 400 },
      );
    }

    const songId = parseInt(songIdStr, 10);
    if (isNaN(songId)) {
      return NextResponse.json({ error: "invalid songId" }, { status: 400 });
    }

    // 1. 查 navid_song 表，拿到 Navidrome 歌曲 ID
    const serviceClient = getServiceClient();
    if (!serviceClient) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 },
      );
    }

    const { data: navidRow, error: navidErr } = await serviceClient
      .from(TABLES.NAVID_SONG)
      .select("navid_id")
      .eq("id", songId)
      .maybeSingle();

    if (navidErr) {
      return NextResponse.json(
        { error: "Failed to query navid_song" },
        { status: 500 },
      );
    }

    if (!navidRow?.navid_id) {
      return NextResponse.json(
        { error: "No audio file for this song" },
        { status: 404 },
      );
    }

    const navidSongId = navidRow.navid_id as string;

    // 2. 查当前用户的 Navidrome 凭据
    const supabase = await createSupabaseServerClient();
    const { data: userData, error: userErr } = await supabase
      .from(TABLES.USERS)
      .select("navid_id, navid_pw, endpoint")
      .eq("id", user.id)
      .maybeSingle();

    if (userErr || !userData) {
      return NextResponse.json(
        { error: "Failed to fetch user credentials" },
        { status: 500 },
      );
    }

    const { navid_id, navid_pw, endpoint } = userData as {
      navid_id: string | null;
      navid_pw: string | null;
      endpoint: string | null;
    };

    if (!navid_id || !navid_pw || !endpoint) {
      return NextResponse.json(
        { error: "Navidrome credentials not configured" },
        { status: 403 },
      );
    }

    // 3. 构造 Subsonic stream URL
    const salt = nodeCrypto.randomBytes(8).toString("hex");
    const token = md5(navid_pw + salt);
    const base = endpoint.replace(/\/$/, "");

    const params = new URLSearchParams({
      u: navid_id,
      t: token,
      s: salt,
      v: "1.16.1",
      c: "katoweb",
      id: navidSongId,
      format: "raw",
    });

    return NextResponse.json({ url: `${base}/rest/stream?${params}` });
  },
);
