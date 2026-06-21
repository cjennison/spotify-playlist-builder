import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSpotifyLinked } from "@/lib/spotify";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const linked = await isSpotifyLinked(session.user.id);
  return NextResponse.json({ linked });
}
