import { redirect } from "next/navigation";
import {
  Box,
  Button,
  Center,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconBrandGoogleFilled, IconVinyl } from "@tabler/icons-react";
import { auth, signIn } from "@/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/builder");
  }

  return (
    <Box
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--page-bg)",
        backgroundImage:
          "radial-gradient(60rem 40rem at 50% -10%, rgba(29,185,84,0.16), transparent 60%), radial-gradient(40rem 30rem at 90% 110%, rgba(29,185,84,0.08), transparent 60%)",
      }}
    >
      <Center mih="100dvh" px="md">
        <Stack align="center" gap="xl" w="100%" maw={440}>
          <Group gap="xs">
            <ThemeIcon size={34} radius="md" variant="light" color="brand">
              <IconVinyl size={22} />
            </ThemeIcon>
            <Text fw={700} fz="lg" style={{ letterSpacing: "-0.02em" }}>
              Blendlist
            </Text>
          </Group>

          <Paper
            withBorder
            shadow="md"
            radius="lg"
            p={36}
            w="100%"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <Stack gap="lg">
              <Stack gap={6}>
                <Title order={1} style={{ letterSpacing: "-0.03em" }}>
                  Blend your tastes
                </Title>
                <Text c="dimmed" fz="sm" lh={1.6}>
                  Turn two or more people&apos;s favorite artists into one
                  AI-curated Spotify playlist — balanced between what they love
                  and what they&apos;ll discover next.
                </Text>
              </Stack>

              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/builder" });
                }}
              >
                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  radius="md"
                  variant="default"
                  leftSection={<IconBrandGoogleFilled size={18} />}
                >
                  Continue with Google
                </Button>
              </form>

              <Divider label="Private access" labelPosition="center" />

              <Text c="dimmed" fz="xs" ta="center">
                Sign-in is restricted to approved accounts.
              </Text>
            </Stack>
          </Paper>

          <Text c="dimmed" fz="xs">
            Made for sharing music, together.
          </Text>
        </Stack>
      </Center>
    </Box>
  );
}
