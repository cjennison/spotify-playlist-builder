import { redirect } from "next/navigation";
import {
  Badge,
  Box,
  Button,
  Group,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconBrandSpotify,
  IconCircleCheckFilled,
  IconLogout,
  IconVinyl,
} from "@tabler/icons-react";
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
    <Box style={{ minHeight: "100dvh", backgroundColor: "var(--page-bg)" }}>
      <Box
        component="header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "rgba(255,255,255,0.8)",
          backdropFilter: "saturate(180%) blur(10px)",
          borderBottom: "1px solid var(--mantine-color-gray-2)",
        }}
      >
        <Group
          justify="space-between"
          h={60}
          px="md"
          wrap="nowrap"
          maw={960}
          mx="auto"
        >
          <Group gap="xs">
            <ThemeIcon size={30} radius="md" variant="light" color="brand">
              <IconVinyl size={20} />
            </ThemeIcon>
            <Text fw={700} style={{ letterSpacing: "-0.02em" }}>
              Blendlist
            </Text>
          </Group>

          <Group gap="sm" wrap="nowrap">
            <Text c="dimmed" fz="sm" visibleFrom="sm">
              {session.user.email}
            </Text>

            {linked ? (
              <Badge
                size="lg"
                radius="sm"
                variant="light"
                color="brand"
                leftSection={<IconCircleCheckFilled size={14} />}
              >
                Spotify connected
              </Badge>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signIn("spotify", { redirectTo: "/builder" });
                }}
              >
                <Button
                  type="submit"
                  size="xs"
                  radius="md"
                  color="brand"
                  leftSection={<IconBrandSpotify size={16} />}
                >
                  Connect Spotify
                </Button>
              </form>
            )}

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button
                type="submit"
                size="xs"
                radius="md"
                variant="subtle"
                color="gray"
                leftSection={<IconLogout size={16} />}
              >
                Sign out
              </Button>
            </form>
          </Group>
        </Group>
      </Box>

      <Builder spotifyLinked={linked} />
    </Box>
  );
}
