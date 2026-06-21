"use client";

import { createTheme, rem, type MantineColorsTuple } from "@mantine/core";

const brand: MantineColorsTuple = [
  "#e6fbef",
  "#d0f5e0",
  "#a2eac0",
  "#70df9d",
  "#4bd680",
  "#33d06f",
  "#1db954", // index 6 — iconic Spotify green
  "#15a448",
  "#0a8d3b",
  "#00752d",
];

// Cool charcoal surfaces for a premium dark UI.
const dark: MantineColorsTuple = [
  "#f3f5f7", // 0 text
  "#cdd2db", // 1
  "#99a1b0", // 2 dimmed
  "#6b7280", // 3
  "#2a2f3a", // 4 borders
  "#1e222c", // 5 inputs / subtle surface
  "#161922", // 6 card surface
  "#0e1117", // 7 body background
  "#0a0c11", // 8
  "#05070a", // 9
];

export const theme = createTheme({
  primaryColor: "brand",
  primaryShade: { light: 6, dark: 6 },
  colors: { brand, dark },
  white: "#ffffff",
  black: "#0a0c11",
  fontFamily:
    "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
  fontFamilyMonospace: "var(--font-geist-mono), ui-monospace, monospace",
  headings: {
    fontFamily:
      "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
    fontWeight: "800",
    sizes: {
      h1: { fontSize: rem(40), lineHeight: "1.1" },
      h2: { fontSize: rem(24), lineHeight: "1.2" },
      h3: { fontSize: rem(18), lineHeight: "1.3" },
    },
  },
  defaultRadius: "md",
  radius: { md: rem(12), lg: rem(18) },
  cursorType: "pointer",
});
