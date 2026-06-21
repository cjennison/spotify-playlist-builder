"use client";

import { createTheme, rem } from "@mantine/core";

export const theme = createTheme({
  primaryColor: "brand",
  primaryShade: { light: 6, dark: 5 },
  colors: {
    // Refined Spotify-inspired green scale.
    brand: [
      "#e6fbef",
      "#d0f5e0",
      "#a2eac0",
      "#70df9d",
      "#4bd680",
      "#33d06f",
      "#1db954", // index 6 — primary
      "#15a448",
      "#0a8d3b",
      "#00752d",
    ],
  },
  fontFamily:
    "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
  fontFamilyMonospace: "var(--font-geist-mono), ui-monospace, monospace",
  headings: {
    fontFamily:
      "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
    fontWeight: "700",
    sizes: {
      h1: { fontSize: rem(34), lineHeight: "1.15" },
      h2: { fontSize: rem(22), lineHeight: "1.25" },
      h3: { fontSize: rem(17), lineHeight: "1.3" },
    },
  },
  defaultRadius: "md",
  radius: {
    md: rem(12),
    lg: rem(18),
  },
  shadows: {
    sm: "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)",
    md: "0 4px 12px rgba(15, 23, 42, 0.06), 0 2px 4px rgba(15, 23, 42, 0.04)",
  },
  cursorType: "pointer",
});
