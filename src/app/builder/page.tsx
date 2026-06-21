import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { isSpotifyLinked } from "@/lib/spotify";
import Builder from "@/components/Builder";

export default async function BuilderPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const linked = await isSpotifyLinked(session.user.id);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 sticky top-0 bg-neutral-950/90 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <span className="font-semibold">Spotify Playlist Builder</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-400 hidden sm:inline">
              {session.user.email}
            </span>
            {linked ? (
              <span className="text-xs rounded-full bg-green-900/50 text-green-300 px-3 py-1">
                Spotify connected
              </span>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signIn("spotify", { redirectTo: "/builder" });
                }}
              >
                <button
                  type="submit"
                  className="text-xs rounded-full bg-green-600 text-white px-3 py-1 hover:bg-green-500"
                >
                  Connect Spotify
                </button>
              </form>
            )}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-xs rounded-full border border-neutral-700 px-3 py-1 hover:bg-neutral-800"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <Builder spotifyLinked={linked} />
    </main>
  );
}
