import { redirect } from "next/navigation";
import AdminClientComponent from "./components/AdminClient";
import { getSongs, TABLE_NAMES } from "../lib/supabase";
import { createSupabaseServerClient } from "../lib/supabase-server";
import type { Song } from "../lib/types";

// 强制动态渲染，不在构建时预渲染
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error(
      "Session error:",
      sessionError?.message || "No session found",
    );
    redirect("/admin/login");
  }

  let songs: Song[] = [];
  let error = null;
  try {
    songs = await getSongs(TABLE_NAMES.ADMIN, session.access_token);
  } catch (e: unknown) {
    if (
      e &&
      typeof e === "object" &&
      "message" in e &&
      typeof (e as Error).message === "string"
    ) {
      error = (e as Error).message;
      console.error("Fetch songs error:", (e as Error).message);
    } else {
      error = "Unknown error";
      console.error("Fetch songs error:", e);
    }
  }

  return <AdminClientComponent initialSongs={songs} initialError={error} />;
}
