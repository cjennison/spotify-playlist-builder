import { redirect } from "next/navigation";
import {
  Badge,
  Button,
  Center,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconBrandGoogleFilled,
  IconSparkles,
  IconAdjustmentsHorizontal,
  IconBrandSpotify,
  IconVinyl,
} from "@tabler/icons-react";
import { auth, signIn } from "@/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/builder");
  }

  return (
    <Center mih="100dvh" px="md" py={48}>
      <Stack align="center" gap={40} w="100%" maw={560}>
        <Group gap={10}>
          <ThemeIcon size={36} radius="md" variant="light" color="brand">
            <IconVinyl size={24} />
          </ThemeIcon>
          <Text fw={800} fz="xl" style={{ letterSpacing: "-0.03em" }}>
            Blendlist
          </Text>
        </Group>

        <Stack align="center" gap="lg">
          <Title order={1} ta="center" style={{ letterSpacing: "-0.04em" }}>
            Two libraries.
            <br />
            One{" "}
            <Text
              span
              inherit
              variant="gradient"
              gradient={{ from: "brand.4", to: "brand.7", deg: 100 }}
            >
              perfect playlist.
            </Text>
          </Title>

          <Text c="dimmed" ta="center" fz="lg" lh={1.6} maw={440}>
            Blendlist mixes the artists two or more people love into one
            AI-curated Spotify playlist — balanced between the familiar and the
            discoveries they&apos;ll thank you for.
          </Text>
        </Stack>

        <Stack align="center" gap="md" w="100%" maw={320}>
          <form
            style={{ width: "100%" }}
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/builder" });
            }}
          >
            <Button
              type="submit"
              fullWidth
              size="lg"
              radius="md"
              variant="white"
              leftSection={<IconBrandGoogleFilled size={20} />}
            >
              Continue with Google
            </Button>
          </form>
          <Text c="dimmed" fz="xs" ta="center">
            Private app — access is restricted to approved accounts.
          </Text>
        </Stack>

        <Group gap="xs" justify="center">
          <Badge
            size="lg"
            radius="sm"
            variant="default"
            leftSection={<IconSparkles size={14} />}
          >
            Music-theory blends
          </Badge>
          <Badge
            size="lg"
            radius="sm"
            variant="default"
            leftSection={<IconAdjustmentsHorizontal size={14} />}
          >
            Ratio control
          </Badge>
          <Badge
            size="lg"
            radius="sm"
            variant="default"
            leftSection={<IconBrandSpotify size={14} />}
          >
            One-click save
          </Badge>
        </Group>
      </Stack>
    </Center>
  );
}
