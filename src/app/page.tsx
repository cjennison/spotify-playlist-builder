import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/builder");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-950 to-neutral-900 text-neutral-100 px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Spotify Playlist Builder
        </h1>
        <p className="text-neutral-400">
          Blend the music tastes of two or more people into one AI-curated
          Spotify playlist — balanced between what they love and what they&apos;ll
          discover.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/builder" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-full bg-white text-neutral-900 font-semibold py-3 hover:bg-neutral-200 transition"
          >
            Sign in with Google
          </button>
        </form>
        <p className="text-xs text-neutral-600">
          Access is restricted to approved accounts.
        </p>
      </div>
    </main>
  );
}
