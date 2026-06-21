import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateBlend } from "@/lib/openai";
import { resolveTracks, isSpotifyLinked, SpotifyNotLinkedError } from "@/lib/spotify";
import type { BlendRequest } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isSpotifyLinked(session.user.id))) {
    return NextResponse.json(
      { error: "Spotify account not linked." },
      { status: 412 }
    );
  }

  let body: BlendRequest;
  try {
    body = (await req.json()) as BlendRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const identities = (body.identities || []).filter(
    (i) => i.name?.trim() && i.artists?.some((a) => a.trim())
  );
  if (identities.length < 2) {
    return NextResponse.json(
      { error: "Provide at least two identities, each with at least one artist." },
      { status: 400 }
    );
  }

  const size = Math.min(Math.max(Number(body.size) || 20, identities.length, 4), 50);
  const knownRatio = Math.min(Math.max(Number(body.knownRatio ?? 0.6), 0), 1);

  try {
    const blend = await generateBlend({ identities, size, knownRatio });
    const tracks = await resolveTracks(session.user.id, blend.tracks);
    if (tracks.length === 0) {
      return NextResponse.json(
        { error: "Could not match any suggestions on Spotify. Try again." },
        { status: 502 }
      );
    }

    // Shuffle so the playlist isn't grouped by identity/source — Fisher-Yates.
    for (let i = tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
    }

    return NextResponse.json({
      name: blend.name,
      description: blend.description,
      tracks,
    });
  } catch (err) {
    if (err instanceof SpotifyNotLinkedError) {
      return NextResponse.json(
        { error: "Spotify account not linked." },
        { status: 412 }
      );
    }
    console.error("generate error", err);
    return NextResponse.json(
      { error: "Failed to generate playlist." },
      { status: 500 }
    );
  }
}
