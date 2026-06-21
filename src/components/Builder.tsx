"use client";

import { useState } from "react";
import {
  ActionIcon,
  Alert,
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Slider,
  Stack,
  Switch,
  Text,
  TextInput,
  TagsInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertTriangle,
  IconBrandSpotify,
  IconCheck,
  IconExternalLink,
  IconMusic,
  IconUserPlus,
  IconX,
} from "@tabler/icons-react";
import type { Identity, ResolvedTrack } from "@/types";

interface GenerateResponse {
  name: string;
  description: string;
  tracks: ResolvedTrack[];
}

const ACCENTS = ["brand", "blue", "grape", "orange", "pink", "cyan"];
const emptyIdentity = (): Identity => ({ name: "", artists: [] });

export default function Builder({ spotifyLinked }: { spotifyLinked: boolean }) {
  const [identities, setIdentities] = useState<Identity[]>([
    { name: "", artists: [] },
    { name: "", artists: [] },
  ]);
  const [size, setSize] = useState(20);
  const [knownRatio, setKnownRatio] = useState(0.6);

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  function updateIdentity(idx: number, patch: Partial<Identity>) {
    setIdentities((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  }

  function addIdentity() {
    setIdentities((prev) => [...prev, emptyIdentity()]);
  }

  function removeIdentity(idx: number) {
    setIdentities((prev) => prev.filter((_, i) => i !== idx));
  }

  function cleanedIdentities(): Identity[] {
    return identities
      .map((i) => ({
        name: i.name.trim(),
        artists: i.artists.map((a) => a.trim()).filter(Boolean),
      }))
      .filter((i) => i.name && i.artists.length > 0);
  }

  async function generate() {
    setError(null);
    setResult(null);
    setPlaylistUrl(null);

    const cleaned = cleanedIdentities();
    if (cleaned.length < 2) {
      setError("Add at least two people, each with a name and one artist.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identities: cleaned, size, knownRatio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate.");
      setResult(data as GenerateResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate.");
    } finally {
      setLoading(false);
    }
  }

  async function createPlaylist() {
    if (!result) return;
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.name,
          description: result.description,
          uris: result.tracks.map((t) => t.uri),
          isPublic,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create playlist.");
      setPlaylistUrl(data.url);
      notifications.show({
        color: "brand",
        icon: <IconCheck size={16} />,
        title: "Playlist created",
        message: "Your blended playlist is now in Spotify.",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create playlist.";
      setError(msg);
      notifications.show({ color: "red", title: "Couldn't save", message: msg });
    } finally {
      setCreating(false);
    }
  }

  const knownPct = Math.round(knownRatio * 100);
  const totalArtists = identities.reduce(
    (n, i) => n + i.artists.filter(Boolean).length,
    0
  );

  return (
    <Container size={920} py={48}>
      <Stack gap={40}>
        {/* Hero */}
        <Stack gap="xs">
          <Badge variant="light" color="brand" radius="sm" w="fit-content">
            New blend
          </Badge>
          <Title order={1} style={{ letterSpacing: "-0.035em" }}>
            Create a blend
          </Title>
          <Text c="dimmed" fz="lg" maw={560}>
            Add everyone&apos;s favorite artists, set the vibe, and let the AI
            weave them into one shared playlist.
          </Text>
        </Stack>

        {!spotifyLinked && (
          <Alert
            variant="light"
            color="yellow"
            radius="md"
            icon={<IconAlertTriangle size={18} />}
            title="Connect Spotify to continue"
          >
            Link your Spotify account with the button in the top-right to
            generate and save playlists.
          </Alert>
        )}

        {/* Identities */}
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Group gap="xs" align="baseline">
              <Title order={2} style={{ letterSpacing: "-0.02em" }}>
                People
              </Title>
              <Text c="dimmed" fz="sm">
                {identities.length} · {totalArtists} artists
              </Text>
            </Group>
            <Button
              variant="default"
              radius="xl"
              leftSection={<IconUserPlus size={16} />}
              onClick={addIdentity}
            >
              Add person
            </Button>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {identities.map((identity, idIdx) => {
              const accent = ACCENTS[idIdx % ACCENTS.length];
              const initial = identity.name.trim()
                ? identity.name.trim()[0].toUpperCase()
                : String(idIdx + 1);
              return (
                <Card
                  key={idIdx}
                  withBorder
                  radius="lg"
                  padding="lg"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <Stack gap="md">
                    <Group gap="sm" wrap="nowrap">
                      <Avatar radius="xl" size={42} color={accent} variant="filled">
                        {initial}
                      </Avatar>
                      <TextInput
                        flex={1}
                        size="md"
                        variant="filled"
                        placeholder={`Person ${idIdx + 1}`}
                        value={identity.name}
                        onChange={(e) =>
                          updateIdentity(idIdx, { name: e.currentTarget.value })
                        }
                      />
                      {identities.length > 2 && (
                        <Tooltip label="Remove person" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="lg"
                            aria-label="Remove person"
                            onClick={() => removeIdentity(idIdx)}
                          >
                            <IconX size={18} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>

                    <TagsInput
                      variant="filled"
                      label="Liked artists"
                      placeholder={
                        identity.artists.length ? "Add another…" : "e.g. Cake, Flobots"
                      }
                      value={identity.artists}
                      onChange={(value) => updateIdentity(idIdx, { artists: value })}
                      clearable
                      splitChars={[",", "\n"]}
                    />
                  </Stack>
                </Card>
              );
            })}
          </SimpleGrid>
        </Stack>

        {/* Controls */}
        <Card
          withBorder
          radius="lg"
          padding="xl"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <Stack gap="xl">
            <Box>
              <Group justify="space-between" mb="sm">
                <Text fw={600}>Playlist size</Text>
                <Badge variant="light" color="gray" radius="sm" size="lg">
                  {size} tracks
                </Badge>
              </Group>
              <Slider
                color="brand"
                size="lg"
                min={4}
                max={50}
                value={size}
                onChange={setSize}
                marks={[
                  { value: 4, label: "4" },
                  { value: 25, label: "25" },
                  { value: 50, label: "50" },
                ]}
              />
            </Box>

            <Box>
              <Group justify="space-between" mb="sm">
                <Text fw={600}>Known vs. discovery</Text>
                <Badge variant="light" color="brand" radius="sm" size="lg">
                  {knownPct}% known · {100 - knownPct}% discovery
                </Badge>
              </Group>
              <Slider
                color="brand"
                size="lg"
                min={0}
                max={100}
                value={knownPct}
                onChange={(v) => setKnownRatio(v / 100)}
                marks={[
                  { value: 0, label: "Discover" },
                  { value: 100, label: "Familiar" },
                ]}
              />
              <Text c="dimmed" fz="xs" mt="xl">
                Higher keeps more songs by artists they already love. Lower leans
                into music-theory-based discoveries.
              </Text>
            </Box>

            <Button
              size="lg"
              radius="md"
              color="brand"
              fullWidth
              loading={loading}
              disabled={!spotifyLinked}
              leftSection={<IconMusic size={20} />}
              onClick={generate}
            >
              {loading ? "Blending tastes…" : "Generate playlist"}
            </Button>
          </Stack>
        </Card>

        {error && (
          <Alert
            variant="light"
            color="red"
            radius="md"
            icon={<IconAlertTriangle size={18} />}
            withCloseButton
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Results */}
        {result && (
          <Stack gap="md">
            <Group justify="space-between" align="flex-end" wrap="wrap">
              <Stack gap={4}>
                <Title order={2} style={{ letterSpacing: "-0.02em" }}>
                  {result.name}
                </Title>
                <Text c="dimmed" fz="sm">
                  {result.description}
                </Text>
                <Text c="dimmed" fz="xs" mt={2}>
                  {result.tracks.length} tracks matched on Spotify
                </Text>
              </Stack>
              <Group gap="md">
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.currentTarget.checked)}
                  label="Public"
                  color="brand"
                />
                <Button
                  radius="xl"
                  color="brand"
                  loading={creating}
                  leftSection={<IconBrandSpotify size={18} />}
                  onClick={createPlaylist}
                >
                  Save to Spotify
                </Button>
              </Group>
            </Group>

            {playlistUrl && (
              <Alert
                variant="light"
                color="brand"
                radius="md"
                icon={<IconCheck size={18} />}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Text fz="sm">Playlist created in your Spotify library.</Text>
                  <Anchor
                    href={playlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    fz="sm"
                    fw={600}
                  >
                    <Group gap={4} wrap="nowrap">
                      Open <IconExternalLink size={14} />
                    </Group>
                  </Anchor>
                </Group>
              </Alert>
            )}

            <Paper
              withBorder
              radius="lg"
              style={{
                overflow: "hidden",
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              {result.tracks.map((t, i) => (
                <Box key={t.uri + i}>
                  {i > 0 && <Divider color="var(--border)" />}
                  <Group gap="md" wrap="nowrap" p="sm">
                    <Text fz="xs" c="dimmed" w={20} ta="right">
                      {i + 1}
                    </Text>
                    <Avatar src={t.albumImage} radius="sm" size={44}>
                      <IconMusic size={20} />
                    </Avatar>
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Text fz="sm" fw={600} truncate>
                        {t.spotifyTitle}
                      </Text>
                      <Text fz="xs" c="dimmed" truncate>
                        {t.spotifyArtist}
                      </Text>
                    </Box>
                    <Stack gap={2} align="flex-end">
                      <Badge
                        size="sm"
                        radius="sm"
                        variant="light"
                        color={t.source === "known" ? "blue" : "grape"}
                      >
                        {t.source}
                      </Badge>
                      <Text fz={10} c="dimmed">
                        {t.identity}
                      </Text>
                    </Stack>
                  </Group>
                </Box>
              ))}
            </Paper>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
