import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchArtists, SpotifyNotLinkedError } from "@/lib/spotify";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const q = new URL(req.url).searchParams.get("q") || "";
  if (!q.trim()) return NextResponse.json({ artists: [] });

  try {
    const artists = await searchArtists(session.user.id, q);
    return NextResponse.json({ artists });
  } catch (err) {
    if (err instanceof SpotifyNotLinkedError) {
      return NextResponse.json({ artists: [] });
    }
    console.error("artist search error", err);
    return NextResponse.json({ artists: [] });
  }
}
