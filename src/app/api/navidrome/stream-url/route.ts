import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase-auth";
import { TABLES } from "@/lib/supabase-server";
const nodeCrypto = require("crypto") as typeof import("crypto");

function md5(input: string): string {
  return nodeCrypto.createHash("md5").update(input, "utf8").digest("hex");
}

export const GET = withAuth(
  async (request: NextRequest, user: AuthenticatedUser) => {
    const { searchParams } = new URL(request.url);
    const songId = searchParams.get("songId")?.trim();

    if (!songId) {
      return NextResponse.json(
        { error: "songId is required" },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select("navid_id, navid_pw, endpoint")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to fetch user credentials" },
        { status: 500 },
      );
    }

    const { navid_id, navid_pw, endpoint } = data as {
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

    const salt = nodeCrypto.randomBytes(8).toString("hex");
    const token = md5(navid_pw + salt);
    const base = endpoint.replace(/\/$/, "");

    const params = new URLSearchParams({
      u: navid_id,
      t: token,
      s: salt,
      v: "1.16.1",
      c: "katoweb",
      id: songId,
      format: "raw",
    });

    const streamUrl = `${base}/rest/stream?${params.toString()}`;

    return NextResponse.json({ url: streamUrl });
  },
);
