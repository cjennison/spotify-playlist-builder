import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Spotify from "next-auth/providers/spotify";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";

/**
 * Comma-separated list of Google account emails that are allowed to sign in.
 * Anyone not on the list is rejected by the `signIn` callback below.
 */
function getWhitelist(): string[] {
  return (process.env.AUTH_WHITELIST || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-read-private",
  "playlist-modify-public",
  "playlist-modify-private",
].join(" ");

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB || "spotify_playlist_builder",
  }),
  session: { strategy: "database" },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        url: "https://accounts.spotify.com/authorize",
        params: { scope: SPOTIFY_SCOPES, show_dialog: "true" },
      },
      // Allows linking the Spotify account to the existing (Google) user.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async signIn({ account, profile }) {
      // The whitelist is enforced on the primary Google login only.
      // Spotify sign-in is used to LINK a Spotify account to an already
      // authenticated (whitelisted) user, so it is allowed through here.
      if (account?.provider === "google") {
        const email = (profile?.email || "").toLowerCase();
        const whitelist = getWhitelist();
        if (whitelist.length === 0) {
          // Fail closed: with no whitelist configured, deny everyone.
          return false;
        }
        return whitelist.includes(email);
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
