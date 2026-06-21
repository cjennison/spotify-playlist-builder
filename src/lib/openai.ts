import OpenAI from "openai";
import type { BlendRequest, BlendResult, SuggestedTrack } from "@/types";

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing environment variable: OPENAI_API_KEY");
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    tracks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          identity: { type: "string" },
          source: { type: "string", enum: ["known", "discovery", "overlap"] },
          artist: { type: "string" },
          title: { type: "string" },
          reason: { type: "string" },
        },
        required: ["identity", "source", "artist", "title", "reason"],
      },
    },
  },
  required: ["name", "description", "tracks"],
} as const;

function buildPrompt(req: BlendRequest): string {
  const knownPct = Math.round(req.knownRatio * 100);
  const discoveryPct = 100 - knownPct;
  const perIdentity = Math.floor(req.size / req.identities.length);

  const identitiesText = req.identities
    .map(
      (i) =>
        `- ${i.name}: ${i.artists.length ? i.artists.join(", ") : "(no seeds given)"}`
    )
    .join("\n");

  const names = req.identities.map((i) => i.name).join(", ");

  return `You are an expert music curator and music theorist building a single shared Spotify playlist that blends the tastes of multiple people ("identities").

Identities and their known liked artists/bands:
${identitiesText}

Requirements:
- Total of EXACTLY ${req.size} tracks.
- Balance the playlist EVENLY across identities (~${perIdentity} tracks each). Every identity must be well represented; do not let one person dominate.
- ${knownPct}% of tracks should be "known": actual songs by the seed artists each identity already likes.
- ${discoveryPct}% of tracks should be "discovery": songs by DIFFERENT artists that the identity would likely also enjoy, chosen using real music-theory reasoning (shared key tendencies, tempo, instrumentation, harmonic/rhythmic style, genre lineage, vocal timbre, lyrical themes). Example: a fan of Cake might enjoy Flobots.
- OVERLAP / COMMON GROUND: actively look for the musical common ground between the identities. Where a genuine overlap exists, include some tracks with source "overlap" — songs by an artist (or in a style) that ALL (or multiple) of these people would enjoy together. Aim for roughly 15-30% of the playlist to be overlap WHEN a real common ground exists; if the tastes are too divergent for honest overlap, include few or even none — never force it. For an "overlap" track, set "identity" to the names of the people who share it joined by " + " (e.g. "${names}").
- For non-overlap tracks, set "identity" to the single identity name it represents.
- Use REAL, well-known songs and correct artist names so they can be found on Spotify. No made-up tracks.
- Avoid duplicate songs and avoid listing the same artist too many times.
- Set "source" to exactly one of "known", "discovery", or "overlap", and "reason" to a one-sentence musical justification (for overlap, explain why it bridges the tastes).
- NAME: invent a FUN, original playlist "name" that fuses these specific tastes — riff on their genres, eras, moods, or a clever mashup/portmanteau of the artists' or bands' names. YOU choose the tone that best fits the blend: a witty pun, a silly/humorous mashup, a slick serious combo, an inside-joke vibe, or a playful portmanteau. Keep it short (2-5 words), specific, and evocative. Avoid generic names like "Blended Playlist", "Eclectic Mix", "Melodic Fusion", or "Eclectic Echoes".
- Write a one-sentence "description" that nods to the blended identities and the name's vibe.

Return strictly the JSON object matching the schema.`;
}

export async function generateBlend(req: BlendRequest): Promise<BlendResult> {
  const completion = await getClient().chat.completions.create({
    model: MODEL,
    temperature: 0.8,
    messages: [
      {
        role: "system",
        content:
          "You are a meticulous music curator. You only output real songs that exist on Spotify and you strictly follow the requested ratios and JSON schema.",
      },
      { role: "user", content: buildPrompt(req) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "blended_playlist",
        strict: true,
        schema: responseSchema,
      },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned no content.");

  const parsed = JSON.parse(content) as BlendResult;
  parsed.tracks = (parsed.tracks || []).filter(
    (t: SuggestedTrack) => t.artist && t.title
  );
  return parsed;
}
