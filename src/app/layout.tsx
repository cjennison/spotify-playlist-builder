import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";
import { theme } from "@/theme";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/brand";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — AI Spotify Playlists that blend tastes`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Spotify playlist generator",
    "AI playlist",
    "blend music tastes",
    "collaborative playlist",
    "music discovery",
    "playlist maker",
    "OpenAI",
    SITE_NAME,
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  category: "music",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: `${SITE_NAME} — AI Spotify Playlists that blend tastes`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — AI Spotify Playlists that blend tastes`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  themeColor: "#0e1117",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jakarta.variable}`}
    >
      <head>
        <ColorSchemeScript defaultColorScheme="dark" forceColorScheme="dark" />
      </head>
      <body>
        <div className="app-bg" />
        <MantineProvider theme={theme} defaultColorScheme="dark" forceColorScheme="dark">
          <Notifications position="top-right" />
          <Providers>{children}</Providers>
        </MantineProvider>
      </body>
    </html>
  );
}
