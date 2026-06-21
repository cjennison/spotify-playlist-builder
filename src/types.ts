export interface Identity {
  /** Display name for this person/identity, e.g. "Chris" */
  name: string;
  /** Seed artists/bands this identity is known to like */
  artists: string[];
}

export type TrackSource = "known" | "discovery";

export interface BlendRequest {
  identities: Identity[];
  /** Total number of tracks in the playlist */
  size: number;
  /**
   * Fraction (0..1) of tracks that should come from KNOWN seed artists.
   * The remainder are music-theory-adjacent DISCOVERY suggestions.
   */
  knownRatio: number;
}

export interface SuggestedTrack {
  /** Which identity this track represents (by name) */
  identity: string;
  source: TrackSource;
  artist: string;
  title: string;
  /** Short reason tying it to the identity / music theory */
  reason: string;
}

export interface BlendResult {
  name: string;
  description: string;
  tracks: SuggestedTrack[];
}

export interface ResolvedTrack extends SuggestedTrack {
  uri: string;
  spotifyArtist: string;
  spotifyTitle: string;
  albumImage?: string;
  previewUrl?: string | null;
}
