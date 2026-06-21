import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { SuggestedTrack, ResolvedTrack } from "@/types";

const SPOTIFY_API = "https://api.spotify.com/v1";
const TOKEN_URL = "https://accounts.spotify.com/api/token";

interface SpotifyAccount {
  userId: ObjectId;
  provider: string;
  providerAccountId: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number; // unix seconds
}

export class SpotifyNotLinkedError extends Error {
  constructor() {
    super("Spotify account is not linked.");
    this.name = "SpotifyNotLinkedError";
  }
}

async function getSpotifyAccount(userId: string): Promise<SpotifyAccount> {
  const db = await getDb();
  const account = await db.collection<SpotifyAccount>("accounts").findOne({
    userId: new ObjectId(userId),
    provider: "spotify",
  });
  if (!account) throw new SpotifyNotLinkedError();
  return account;
}

export async function isSpotifyLinked(userId: string): Promise<boolean> {
  try {
    await getSpotifyAccount(userId);
    return true;
  } catch {
    return false;
  }
}

async function refreshAccessToken(account: SpotifyAccount): Promise<string> {
  if (!account.refresh_token) throw new SpotifyNotLinkedError();

  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to refresh Spotify token: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };

  const expires_at = Math.floor(Date.now() / 1000) + data.expires_in;
  const db = await getDb();
  await db.collection<SpotifyAccount>("accounts").updateOne(
    { userId: account.userId, provider: "spotify" },
    {
      $set: {
        access_token: data.access_token,
        expires_at,
        ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
      },
    }
  );

  return data.access_token;
}

async function getAccessToken(userId: string): Promise<string> {
  const account = await getSpotifyAccount(userId);
  const now = Math.floor(Date.now() / 1000);
  // Refresh slightly early to avoid edge-of-expiry failures.
  if (!account.access_token || !account.expires_at || account.expires_at - 60 <= now) {
    return refreshAccessToken(account);
  }
  return account.access_token;
}

async function spotifyFetch(
  userId: string,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken(userId);
  return fetch(`${SPOTIFY_API}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

interface SpotifyTrackItem {
  uri: string;
  name: string;
  preview_url: string | null;
  artists: { name: string }[];
  album: { images: { url: string }[] };
}

async function searchTrack(
  userId: string,
  artist: string,
  title: string
): Promise<SpotifyTrackItem | null> {
  const q = `track:${title} artist:${artist}`;
  const params = new URLSearchParams({ q, type: "track", limit: "1" });
  const res = await spotifyFetch(userId, `/search?${params.toString()}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { tracks?: { items: SpotifyTrackItem[] } };
  const item = data.tracks?.items?.[0];
  if (item) return item;

  // Fallback: looser free-text search.
  const params2 = new URLSearchParams({
    q: `${title} ${artist}`,
    type: "track",
    limit: "1",
  });
  const res2 = await spotifyFetch(userId, `/search?${params2.toString()}`);
  if (!res2.ok) return null;
  const data2 = (await res2.json()) as { tracks?: { items: SpotifyTrackItem[] } };
  return data2.tracks?.items?.[0] ?? null;
}

/** Resolve AI-suggested tracks to real Spotify tracks, dropping unfound/dupes. */
export async function resolveTracks(
  userId: string,
  suggestions: SuggestedTrack[]
): Promise<ResolvedTrack[]> {
  const resolved: ResolvedTrack[] = [];
  const seen = new Set<string>();

  for (const s of suggestions) {
    const item = await searchTrack(userId, s.artist, s.title);
    if (!item) continue;
    if (seen.has(item.uri)) continue;
    seen.add(item.uri);
    resolved.push({
      ...s,
      uri: item.uri,
      spotifyArtist: item.artists.map((a) => a.name).join(", "),
      spotifyTitle: item.name,
      albumImage: item.album?.images?.[0]?.url,
      previewUrl: item.preview_url,
    });
  }
  return resolved;
}

export async function getCurrentUserId(userId: string): Promise<string> {
  const res = await spotifyFetch(userId, "/me");
  if (!res.ok) throw new Error(`Failed to load Spotify profile: ${await res.text()}`);
  const data = (await res.json()) as { id: string };
  return data.id;
}

export async function createPlaylist(
  userId: string,
  opts: { name: string; description: string; uris: string[]; isPublic: boolean }
): Promise<{ id: string; url: string }> {
  const spotifyUserId = await getCurrentUserId(userId);

  const createRes = await spotifyFetch(
    userId,
    `/users/${spotifyUserId}/playlists`,
    {
      method: "POST",
      body: JSON.stringify({
        name: opts.name,
        description: opts.description,
        public: opts.isPublic,
      }),
    }
  );
  if (!createRes.ok) {
    throw new Error(`Failed to create playlist: ${await createRes.text()}`);
  }
  const playlist = (await createRes.json()) as {
    id: string;
    external_urls: { spotify: string };
  };

  // Spotify accepts up to 100 URIs per request.
  for (let i = 0; i < opts.uris.length; i += 100) {
    const chunk = opts.uris.slice(i, i + 100);
    const addRes = await spotifyFetch(
      userId,
      `/playlists/${playlist.id}/tracks`,
      { method: "POST", body: JSON.stringify({ uris: chunk }) }
    );
    if (!addRes.ok) {
      throw new Error(`Failed to add tracks: ${await addRes.text()}`);
    }
  }

  return { id: playlist.id, url: playlist.external_urls.spotify };
}
