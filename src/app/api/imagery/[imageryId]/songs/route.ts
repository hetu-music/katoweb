import { NextRequest, NextResponse } from "next/server";
import { getSongsForImagery } from "@/lib/service-imagery";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ imageryId: string }> },
) {
  const { imageryId } = await params;
  const id = parseInt(imageryId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ songs: [] }, { status: 400 });
  }

  try {
    const results = await getSongsForImagery(id);
    return NextResponse.json({ songs: results });
  } catch (err) {
    console.error("Failed to fetch songs for imagery:", err);
    return NextResponse.json({ songs: [] }, { status: 500 });
  }
}
