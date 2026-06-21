"use client";

import { useState } from "react";
import type { Identity, ResolvedTrack } from "@/types";

interface GenerateResponse {
  name: string;
  description: string;
  tracks: ResolvedTrack[];
}

const emptyIdentity = (): Identity => ({ name: "", artists: [""] });

export default function Builder({ spotifyLinked }: { spotifyLinked: boolean }) {
  const [identities, setIdentities] = useState<Identity[]>([
    { name: "", artists: [""] },
    { name: "", artists: [""] },
  ]);
  const [size, setSize] = useState(20);
  const [knownRatio, setKnownRatio] = useState(0.6);

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  function updateIdentity(idx: number, patch: Partial<Identity>) {
    setIdentities((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  }

  function updateArtist(idIdx: number, artIdx: number, value: string) {
    setIdentities((prev) =>
      prev.map((it, i) => {
        if (i !== idIdx) return it;
        const artists = [...it.artists];
        artists[artIdx] = value;
        return { ...it, artists };
      })
    );
  }

  function addArtist(idIdx: number) {
    setIdentities((prev) =>
      prev.map((it, i) =>
        i === idIdx ? { ...it, artists: [...it.artists, ""] } : it
      )
    );
  }

  function removeArtist(idIdx: number, artIdx: number) {
    setIdentities((prev) =>
      prev.map((it, i) =>
        i === idIdx
          ? { ...it, artists: it.artists.filter((_, a) => a !== artIdx) }
          : it
      )
    );
  }

  function addIdentity() {
    setIdentities((prev) => [...prev, emptyIdentity()]);
  }

  function removeIdentity(idx: number) {
    setIdentities((prev) => prev.filter((_, i) => i !== idx));
  }

  function cleanedIdentities(): Identity[] {
    return identities
      .map((i) => ({
        name: i.name.trim(),
        artists: i.artists.map((a) => a.trim()).filter(Boolean),
      }))
      .filter((i) => i.name && i.artists.length > 0);
  }

  async function generate() {
    setError(null);
    setResult(null);
    setPlaylistUrl(null);

    const cleaned = cleanedIdentities();
    if (cleaned.length < 2) {
      setError("Add at least two identities, each with a name and one artist.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identities: cleaned, size, knownRatio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate.");
      setResult(data as GenerateResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate.");
    } finally {
      setLoading(false);
    }
  }

  async function createPlaylist() {
    if (!result) return;
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.name,
          description: result.description,
          uris: result.tracks.map((t) => t.uri),
          isPublic,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create playlist.");
      setPlaylistUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create playlist.");
    } finally {
      setCreating(false);
    }
  }

  const knownPct = Math.round(knownRatio * 100);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {!spotifyLinked && (
        <div className="rounded-lg border border-yellow-700/50 bg-yellow-900/20 text-yellow-200 px-4 py-3 text-sm">
          Connect your Spotify account (top right) to generate and save
          playlists.
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Identities</h2>
          <button
            onClick={addIdentity}
            className="text-sm rounded-full border border-neutral-700 px-3 py-1 hover:bg-neutral-800"
          >
            + Add identity
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {identities.map((identity, idIdx) => (
            <div
              key={idIdx}
              className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <input
                  value={identity.name}
                  onChange={(e) =>
                    updateIdentity(idIdx, { name: e.target.value })
                  }
                  placeholder={`Person ${idIdx + 1} name`}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-600"
                />
                {identities.length > 2 && (
                  <button
                    onClick={() => removeIdentity(idIdx)}
                    className="text-neutral-500 hover:text-red-400 text-sm px-2"
                    title="Remove identity"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-neutral-500">
                  Liked artists / bands
                </label>
                {identity.artists.map((artist, artIdx) => (
                  <div key={artIdx} className="flex items-center gap-2">
                    <input
                      value={artist}
                      onChange={(e) =>
                        updateArtist(idIdx, artIdx, e.target.value)
                      }
                      placeholder="e.g. Cake"
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-600"
                    />
                    {identity.artists.length > 1 && (
                      <button
                        onClick={() => removeArtist(idIdx, artIdx)}
                        className="text-neutral-500 hover:text-red-400 text-sm px-2"
                        title="Remove artist"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addArtist(idIdx)}
                  className="text-xs text-neutral-400 hover:text-neutral-200"
                >
                  + Add artist
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-5">
        <div>
          <div className="flex items-center justify-between text-sm">
            <label className="font-medium">Playlist size</label>
            <span className="text-neutral-400">{size} tracks</span>
          </div>
          <input
            type="range"
            min={4}
            max={50}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full accent-green-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-sm">
            <label className="font-medium">Known vs. discovery</label>
            <span className="text-neutral-400">
              {knownPct}% known · {100 - knownPct}% discovery
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={knownPct}
            onChange={(e) => setKnownRatio(Number(e.target.value) / 100)}
            className="w-full accent-green-500"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Higher = more songs by artists they already love. Lower = more
            music-theory-based discoveries.
          </p>
        </div>

        <button
          onClick={generate}
          disabled={loading || !spotifyLinked}
          className="w-full rounded-full bg-green-600 text-white font-semibold py-3 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Blending tastes…" : "Generate playlist"}
        </button>
      </section>

      {error && (
        <div className="rounded-lg border border-red-700/50 bg-red-900/20 text-red-200 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {result && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{result.name}</h2>
              <p className="text-sm text-neutral-400">{result.description}</p>
              <p className="text-xs text-neutral-600 mt-1">
                {result.tracks.length} tracks matched on Spotify
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-neutral-400">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="accent-green-500"
                />
                Public
              </label>
              <button
                onClick={createPlaylist}
                disabled={creating}
                className="rounded-full bg-white text-neutral-900 font-semibold px-5 py-2 hover:bg-neutral-200 disabled:opacity-50 transition"
              >
                {creating ? "Saving…" : "Save to Spotify"}
              </button>
            </div>
          </div>

          {playlistUrl && (
            <a
              href={playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-green-700/50 bg-green-900/20 text-green-200 px-4 py-3 text-sm hover:bg-green-900/30"
            >
              ✓ Playlist created — open it in Spotify ↗
            </a>
          )}

          <ul className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 overflow-hidden">
            {result.tracks.map((t, i) => (
              <li
                key={t.uri + i}
                className="flex items-center gap-3 px-4 py-3 bg-neutral-900/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {t.albumImage ? (
                  <img
                    src={t.albumImage}
                    alt=""
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-neutral-800" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">
                    {t.spotifyTitle}
                  </div>
                  <div className="text-xs text-neutral-400 truncate">
                    {t.spotifyArtist}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                      t.source === "known"
                        ? "bg-blue-900/40 text-blue-300"
                        : "bg-purple-900/40 text-purple-300"
                    }`}
                  >
                    {t.source}
                  </span>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    {t.identity}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
