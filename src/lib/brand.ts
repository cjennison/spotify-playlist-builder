// Shared brand mark (a green vinyl record) used for favicons and social images.

export const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4bd680"/>
      <stop offset="1" stop-color="#0a8d3b"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="url(#bg)"/>
  <circle cx="50" cy="50" r="30" fill="#0e1117"/>
  <circle cx="50" cy="50" r="30" fill="none" stroke="#ffffff" stroke-opacity="0.20" stroke-width="2"/>
  <circle cx="50" cy="50" r="23" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="2"/>
  <circle cx="50" cy="50" r="16" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="2"/>
  <circle cx="50" cy="50" r="9" fill="#1db954"/>
  <circle cx="50" cy="50" r="2.6" fill="#0e1117"/>
</svg>`;

// Vinyl disc only (transparent background) for composing on solid backgrounds.
export const DISC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="44" fill="#0e1117"/>
  <circle cx="50" cy="50" r="44" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="34" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="24" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="13" fill="#1db954"/>
  <circle cx="50" cy="50" r="3.6" fill="#0e1117"/>
</svg>`;

export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://spotify-playlist-builder-beta.vercel.app";

export const SITE_NAME = "Blendlist";
export const SITE_DESCRIPTION =
  "Blend the music tastes of two or more people into one AI-curated Spotify playlist — balanced between the artists they love and the ones they'll discover.";
